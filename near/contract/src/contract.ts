import { NearBindgen, near, call, view } from "near-sdk-js";

interface Job {
  id: string;
  reward?: string;
  labels?: Label[];
  reviews?: Review[];
  expires?: string;
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

@NearBindgen({})
class JobPosting {
  funds: string = "0";
  available_jobs: Job[] = [];

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
  @call({ payableFunction: true })
  add_jobs({ ids }: { ids: string[] }): string {
    const caller = near.predecessorAccountId();
    const funds_attached: bigint = near.attachedDeposit();

    if (near.storageUsage() >= STORAGE_LIMIT) {
      this.send_near(caller, funds_attached);
      return "error: not enough storage available";
    }

    const reward_amount: bigint = funds_attached / BigInt(ids.length);

    if (reward_amount < MIN_REWARD) {
      this.send_near(caller, funds_attached);
      return "error: insufficient funds provided";
    }

    this.funds = funds_attached.toString();
    const expires = near.blockTimestamp() + SECONDS_PER_MONTH;

    ids.map((id) => {
      this.available_jobs.push({
        id: id,
        reward: `${reward_amount}`,
        expires: `${expires}`,
      });
    });

    return "success: jobs added to available jobs list";
  }

  /**
   * cancel one or more jobs by providing a list of job ids
   * @param  {number[]} ids list of ids of jobs to cancel
   * @return {string}       result message (success or error)
   */
  @call({})
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
   * Gets all of the jobs currently available
   * @returns {Job[]} list of Job objects
   */
  @view({})
  get_available_jobs(): Job[] {
    return this.available_jobs;
  }
}
