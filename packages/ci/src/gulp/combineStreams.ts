import { PassThrough } from "stream";

// Function to create a combined readable stream from two streams
export function combineStreams(...streams: NodeJS.ReadableStream[]) {
  const passThrough = new PassThrough();
  let currentStreamIndex = 0;

  function pipeNext() {
    if (currentStreamIndex < streams.length) {
      const currentStream = streams[currentStreamIndex]!;
      currentStream.pipe(passThrough, { end: false });
      currentStream.on("end", () => {
        currentStreamIndex++;
        pipeNext();
      });
      currentStream.on("error", (error) => {
        passThrough.emit("error", error);
      });
    } else {
      passThrough.end();
    }
  }

  pipeNext();
  return passThrough;
}
