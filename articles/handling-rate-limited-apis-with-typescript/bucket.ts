type Consumer = () => void;

export class TokenBucket {
  public capacity: number;
  // the actual rate limit is the capacity / period (in milliseconds)
  public period: number;

  private status: "idle" | "processing" = "idle";
  private bucket: Consumer[] = [];
  private beingProcessed: number = 0;
  private timeoutId: number | null = null;

  constructor(capacity: number, period: number) {
    this.capacity = capacity;
    this.period = period;
  }

  /** Try to consume a token, else place it in the bucket */
  public tryConsume(token: Consumer) {
    if (this.beingProcessed < this.capacity) {
      this.beingProcessed++;
      token();
    } else {
      console.log("Bucket is full, queuing...");
      this.bucket.push(token);
    }
  }

  public start() {
    if (this.status === "processing") return;
    this.status = "processing";
    this.emptyBucket();
  }

  public stop() {
    this.status = "idle";
    console.log("Stopping the bucket...");
    // stop the next cycle
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private emptyBucket() {
    if (this.status === "idle") return;

    const tokens = this.bucket.splice(0, this.capacity);

    // consume the available tokens
    tokens.forEach((consumer) => consumer());
    console.log(`Consumed ${tokens.length} tokens`);

    // update the number of tokens being processed for the next cycle.
    this.beingProcessed = tokens.length;

    this.timeoutId = setTimeout(this.emptyBucket.bind(this), this.period);
  }
}
