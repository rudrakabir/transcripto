import { AudioFile } from '../shared/schema';

export class Queue {
  private items: AudioFile[] = [];

  enqueue(item: AudioFile): void {
    this.items.push(item);
  }

  dequeue(): AudioFile | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}