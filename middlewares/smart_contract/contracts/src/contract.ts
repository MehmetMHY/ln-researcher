import { NearBindgen, near, call, view } from "near-sdk-js";

enum JobStatus {
  AVAILABLE = "available",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

interface Job {
  id: string;
  reward: string;
  expires: string;
  label_keys: string[];
  tasks: Task[];
  final_ranking?: string[];
}

enum TaskType {
  LABEL = "label",
  REVIEW = "review",
}

interface Task {
  type: string;
  assigned_to: string;
  public_key: string;
  time_assigned: string;
  time_submitted?: string;
  data?: any;
}

interface JobDescription {
  id: string;
  label_keys: string[];
}

const NANOSECONDS_PER_HOUR = BigInt(3600000000000);

// placeholder configuration
const TIME_LIMIT = NANOSECONDS_PER_HOUR;
const STORAGE_LIMIT: bigint = BigInt(1000000000000000000000000); // 1 NEAR
const MIN_REWARD: bigint = BigInt(1000000000000000000000000); // 1 NEAR
const NUM_LABELS = 3;
const NUM_REVIEWS = 3;
const REQUEST_FEE = BigInt(10000000000000000000000000); // 10 NEAR

@NearBindgen({})
class JobPosting {
  url: string = "";
  funds: string = "0";
  available_jobs: Job[] = [];
  in_progress_jobs: Job[] = [];
  completed_jobs: Job[] = [];

  @view({})
  get_url(): string {
    return this.url;
  }

  @call({})
  set_url({ url }: { url: string }) {
    this.url = url;
  }

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

  @call({ privateFunction: true })
  return_funds({ recipient }: { recipient: string }): void {
    this.send_near(recipient, BigInt(this.funds));
    this.funds = "0";
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
  add_jobs({ descriptions }: { descriptions: JobDescription[] }): string {
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

    const expires = near.blockTimestamp() + TIME_LIMIT;

    descriptions.map(({ id, label_keys }) => {
      this.available_jobs.push({
        id: id,
        reward: `${reward_amount}`,
        expires: `${expires}`,
        label_keys: label_keys,
        tasks: [],
      });
    });

    this.funds = (
      BigInt(this.funds) -
      reward_amount * BigInt(ids.length)
    ).toString();

    return "success: jobs added to available jobs list";
  }

  /**
   * cancel one or more jobs by providing a list of job ids
   * @param  {number[]} ids list of ids of jobs to cancel
   * @return {string}       result message (success or error)
   */
  @call({ privateFunction: true })
  cancel_jobs({ ids }: { ids: string[] }): string {
    if (!this.available_jobs.length) {
      return "error: no jobs that can be cancelled";
    }

    const canceled_jobs = [];
    const errors = [];
    ids.map((id) => {
      // only jobs in the available jobs list can be canceled
      const job = this.available_jobs.find((job) => job.id === id);
      if (job) {
        this.available_jobs = this.available_jobs.filter((job) => job.id != id);
        canceled_jobs.push(job.id);
        this.funds = (BigInt(this.funds) + BigInt(job.reward)).toString();
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
    let jobs: Job[];
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

  @call({ privateFunction: true })
  recall_task({
    job_id,
    assigned_to,
  }: {
    job_id: string;
    assigned_to: string;
  }): string | undefined {
    const job = this.in_progress_jobs.find((job) => job.id === job_id);
    near.log(job);

    if (BigInt(job.expires) < near.blockTimestamp()) {
      return "error: job is not expired";
    }

    this.in_progress_jobs = this.in_progress_jobs.filter(
      (ip_job) => ip_job != job
    );
    const to_recall = job.tasks.find(
      (task) => task.assigned_to === assigned_to
    );
    job.tasks = job.tasks.filter((task) => task != to_recall);
    near.log(job);
    this.available_jobs.push(job);
  }

  @view({})
  get_request_fee(): string {
    return REQUEST_FEE.toString();
  }

  /**
   * Request a task, will assign a label or review, depending on what is needed
   * @returns {Task | string} assigned task or error message
   */
  @call({ payableFunction: true })
  request_task({
    rsa_pk,
  }: {
    rsa_pk: string;
  }): { url: string; id: string; task: Task } | string {
    if (!rsa_pk) {
      return "error: must provide rsa public key";
    }

    if (near.attachedDeposit() < REQUEST_FEE) {
      this.send_near(near.predecessorAccountId(), near.attachedDeposit());
      return "error: insufficient funds";
    }

    if (this.available_jobs.length === 0) {
      return "error: no available jobs";
    }

    const requester_id = near.predecessorAccountId();
    const assigned_task = this.in_progress_jobs.find((job) => {
      const assigned_tasks = job.tasks.find(
        (task) => task.assigned_to === requester_id
      );
      return assigned_tasks != undefined;
    });

    if (assigned_task) {
      return "error: user currently assigned an unsubmitted task";
    }

    let job: Job = this.available_jobs.pop();

    const num_labels = job.tasks.filter(
      (task) => task.type === TaskType.LABEL
    ).length;

    const num_reviews = job.tasks.filter(
      (task) => task.type === TaskType.REVIEW
    ).length;

    let task_type: TaskType;
    if (num_labels < NUM_LABELS) {
      task_type = TaskType.LABEL;
    } else if (num_reviews < NUM_REVIEWS) {
      task_type = TaskType.REVIEW;
    } else {
      return "error: job already completed";
    }

    let task: Task = {
      type: task_type,
      assigned_to: near.predecessorAccountId(),
      time_assigned: near.blockTimestamp().toString(),
      public_key: rsa_pk,
    };

    job.tasks.push(task);
    this.in_progress_jobs.push(job);
    return { url: this.url, id: job.id, task: task };
  }

  @call({})
  submit_task({
    job_id,
    submission,
  }: {
    job_id: string;
    submission: Task;
  }): void {
    const job = this.in_progress_jobs.find((job) => job.id === job_id);
    let task = job.tasks.find(
      (task) => task.assigned_to === near.predecessorAccountId()
    );
    job.tasks = job.tasks.filter((tmp) => tmp != task);
    task = { time_submitted: near.blockTimestamp().toString(), ...submission };
    job.tasks.push(task);

    const num_labels = job.tasks.filter(
      (task) => task.type === TaskType.LABEL
    ).length;

    const num_reviews = job.tasks.filter(
      (task) => task.type === TaskType.REVIEW
    ).length;

    if (num_labels < NUM_LABELS || num_reviews < NUM_REVIEWS) {
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
    const votes: Map<string[], number> = job.tasks
      .filter((task) => task.type === TaskType.REVIEW)
      .reduce((acc, task) => {
        if (acc.has(task.data.ranking)) {
          acc.set(task.data.ranking, acc.get(task.data.ranking) + 1);
        } else {
          acc.set(task.data.ranking, 1);
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
    const candidates = job.tasks
      .filter((task) => task.type === TaskType.LABEL)
      .map((task) => task.assigned_to);
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
}
