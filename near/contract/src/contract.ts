import { NearBindgen, near, call, view } from "near-sdk-js";

enum JobStatus {
  AVAILABLE = "available",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

interface Job {
  id: string;
  description?: string;
  reward: string;
  expires: string;
  labels?: Label[];
  reviews?: Review[];
  final_ranking?: string[];
}

interface Label {
  labeler: string;
  data: any;
}

interface Review {
  reviewer: string;
  ranking: any;
}

const SECONDS_PER_MONTH: bigint = BigInt(2592000); // (30 days)

// placeholder configuration
const STORAGE_LIMIT: bigint = BigInt(1000000000000000000000000); // 1 NEAR
const MIN_REWARD: bigint = BigInt(1000000000000000000000000); // 1 NEAR
const NUM_LABELS = 3;
const NUM_REVIEWS = 3;

@NearBindgen({})
class JobPosting {
  funds: string = "0";
  available_jobs: Job[] = [];
  in_progress_jobs: Job[] = [];
  completed_jobs: Job[] = [];

  /**
   * Adds funds for job rewards to the smart contract
   * Should only be called by researcher
   */
  @call({ payableFunction: true })
  add_funds({}): void {
    const amount = near.attachedDeposit();
    this.funds = (BigInt(this.funds) + amount).toString();
  }

  /**
   * Get the amount of funds supplied by the researcher
   * @returns {string} funds supplied to smart contract
   */
  @view({})
  get_available_funds(): string {
    return this.funds;
  }

  /**
   * Send the specified amount of near tokens to the specified account
   * @param {string} account_id account to send the tokens to
   * @param {bigint} amount     amount to send
   */
  send_near(account_id: string, amount: bigint): void {
    const promise = near.promiseBatchCreate(account_id);
    near.promiseBatchActionTransfer(promise, amount);
  }

  /**
   * Add jobs to the available jobs list
   * @param { ids: string[] } { ids } list of job ids to add
   * @returns {string}                result message (error or success)
   */
  @call({ privateFunction: true })
  add_jobs({ ids }: { ids: string[] }): string {
    const caller = near.predecessorAccountId();

    if (near.storageUsage() >= STORAGE_LIMIT) {
      this.send_near(caller, BigInt(this.funds));
      return "error: not enough storage available";
    }

    const reward_amount: bigint = BigInt(this.funds) / BigInt(ids.length);

    if (reward_amount < MIN_REWARD) {
      this.send_near(caller, BigInt(this.funds));
      return "error: insufficient funds provided";
    }

    const expires = near.blockTimestamp() + SECONDS_PER_MONTH;

    ids.map((id) => {
      this.available_jobs.push({
        id: id,
        reward: `${reward_amount}`,
        expires: `${expires}`,
        labels: [],
        reviews: [],
      });
    });

    return "success: jobs added to available jobs list";
  }

  /**
   * cancel one or more jobs by providing a list of job ids
   * @param  {number[]} ids list of ids of jobs to cancel
   * @return {string}       result message (success or error)
   */
  @call({ privateFunction: true })
  cancel_jobs({ ids }: { ids: string[] }): string {
    const canceled_jobs = [];
    const errors = [];
    ids.map((id) => {
      // only jobs in the available jobs list can be canceled
      const job = this.available_jobs.find((job) => job.id === id);
      if (job) {
        this.available_jobs = this.available_jobs.filter((job) => job.id != id);
        canceled_jobs.push(job.id);
      } else {
        errors.push(job.id);
      }
    });
    if (!errors.length)
      return `success: canceled ${
        canceled_jobs.length > 1 ? "jobs" : "job"
      } ${canceled_jobs}`;
    // note: all matching jobs present in the available jobs list will be canceled, even if some jobs cannot be canceled
    return `error: ${
      errors.length > 1 ? "jobs" : "job"
    } ${errors} already assigned or do not exist`;
  }

  /**
   * get Job objects by providing list of job ids
   * @param  {number[]}  ids    list of job ids, returns all jobs if empty
   * @param  {JobStatus} status type of jobs to retrieve, (available, in_progress, completed)
   * @return {job[]}            list of job objects with matching ids
   */
  @view({})
  get_jobs({ ids, status }: { ids: string[]; status?: JobStatus }): Job[] {
    let jobs;
    switch (status) {
      case JobStatus.AVAILABLE:
        jobs = this.available_jobs;
        break;
      case JobStatus.IN_PROGRESS:
        jobs = this.in_progress_jobs;
        break;
      case JobStatus.COMPLETED:
        jobs = this.completed_jobs;
        break;
      default:
        jobs = this.available_jobs
          .concat(this.in_progress_jobs)
          .concat(this.completed_jobs);
    }

    if (!ids) return jobs;
    return jobs.filter((job) => ids.includes(job.id));
  }

  /**
   * Request a job
   * @returns {Job | string} assigned job or error message
   */
  @call({})
  request_job(): Job | string {
    if (this.available_jobs.length === 0) {
      return "error: no available jobs";
    }

    const requester_id = near.predecessorAccountId();
    const assigned_job = this.in_progress_jobs.find((job) => {
      const label = job.labels.find((label) => label.labeler === requester_id);
      const review = job.reviews.find(
        (review) => review.reviewer === requester_id
      );
      return label || review;
    });

    if (assigned_job) {
      return "error: user currently assigned an unsubmitted job";
    }

    let job = this.available_jobs.pop();
    if (job.labels.length < NUM_LABELS) {
      job.labels.push({ labeler: requester_id, data: {} });
    } else if (job.reviews.length < NUM_REVIEWS) {
      job.reviews.push({ reviewer: requester_id, ranking: {} });
    }

    this.in_progress_jobs.push(job);
    return job;
  }

  @call({})
  submit_job({ job }: { job: Job }): void {
    if (job.labels.length < NUM_LABELS || job.reviews.length < NUM_REVIEWS) {
      this.available_jobs.push(job);
    } else {
      const ranking = this.rank_reviews(job);
      near.log(`winner: ${ranking[0]}`);
      this.send_near(ranking[0], BigInt(job.reward));
      this.funds = (BigInt(this.funds) - BigInt(job.reward)).toString();
      job.final_ranking = ranking;
      this.completed_jobs.push(job);
    }

    this.in_progress_jobs = this.in_progress_jobs.filter((ipj) => {
      return ipj.id != job.id;
    });
  }

  rank_reviews(job: Job): string[] {
    // group votes by ranking
    const votes: Map<string[], number> = job.reviews.reduce((acc, review) => {
      if (acc.has(review.ranking)) {
        acc.set(review.ranking, acc.get(review.ranking) + 1);
      } else {
        acc.set(review.ranking, 1);
      }
      return acc;
    }, new Map());

    // compute pairwise candidate preferences
    let preferences = {};
    for (let entry of votes) {
      const ranking = entry[0];
      const votes = entry[1];

      for (let i = 0; i < ranking.length - 1; i++) {
        for (let j = i + 1; j < ranking.length; j++) {
          let v = ranking[i];
          let w = ranking[j];

          if (!preferences[v]) {
            preferences[v] = {};
          }

          preferences[v][w] = preferences[v][w]
            ? preferences[v][w] + votes
            : votes;
        }
      }
    }

    // generate cartesion product of candidates
    // exclude pairings of a candidate with themselves
    const candidates = job.labels.map((label) => label.labeler);
    const candidate_pairs = candidates.reduce(
      (pairs, x) => [
        ...pairs,
        ...candidates.filter((y) => x != y).map((y) => [x, y]),
      ],
      []
    );

    // calcualte path strengths
    let strengths = JSON.parse(JSON.stringify(preferences));
    for (let [c_i, c_j] of candidate_pairs) {
      if (preferences[c_i][c_j] > preferences[c_j][c_i]) {
        strengths[c_i][c_j] = preferences[c_i][c_j];
      } else {
        strengths[c_i][c_j] = 0;
      }
    }

    for (let [c_i, c_j] of candidate_pairs) {
      for (let c_k of candidates.filter((c) => c != c_i && c != c_j)) {
        strengths[c_j][c_k] = Math.max(
          strengths[c_j][c_k],
          Math.min(strengths[c_j][c_i], strengths[c_i][c_k])
        );
      }
    }

    // rank candidates
    candidates.sort((c_i, c_j) => {
      if (strengths[c_i][c_j] > strengths[c_j][c_i]) return -1;
      if (strengths[c_i][c_j] < strengths[c_j][c_i]) return 1;
      return 0;
    });

    return candidates;
  }

  /**
   * delete all jobs stored in the contract, can only be called by the account to which the contract is deployed
   */
  @call({ privateFunction: true })
  clear_all_jobs(): void {
    this.available_jobs = [];
    this.in_progress_jobs = [];
    this.completed_jobs = [];
  }
}
