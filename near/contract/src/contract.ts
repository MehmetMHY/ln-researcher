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
   * Gets all of the jobs currently available
   * @returns {Job[]} list of Job objects
   */
  @view({})
  get_available_jobs(): Job[] {
    return this.available_jobs;
  }
}
