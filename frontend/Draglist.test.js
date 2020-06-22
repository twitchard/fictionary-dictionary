import { reorder } from "./DragList";

describe("Draglist", () => {
  const testReorder = (input, from, to, expected) => {
    expect(reorder(input, from, to)).toEqual(expected);
  };
  describe("reorder", () => {
    it("works for lists of length 4", () => {
      testReorder([0, 1, 2, 3], 0, 0, [0, 1, 2, 3]);
      testReorder([0, 1, 2, 3], 0, 1, [1, 0, 2, 3]);
      testReorder([0, 1, 2, 3], 0, 2, [1, 2, 0, 3]);
      testReorder([0, 1, 2, 3], 0, 3, [1, 2, 3, 0]);

      testReorder([0, 1, 2, 3], 0, 1, [1, 0, 2, 3]);
      testReorder([0, 1, 2, 3], 1, 1, [0, 1, 2, 3]);
      testReorder([0, 1, 2, 3], 1, 2, [0, 2, 1, 3]);
      testReorder([0, 1, 2, 3], 1, 3, [0, 2, 3, 1]);

      testReorder([0, 1, 2, 3], 2, 0, [2, 0, 1, 3]);
      testReorder([0, 1, 2, 3], 2, 1, [0, 2, 1, 3]);
      testReorder([0, 1, 2, 3], 2, 2, [0, 1, 2, 3]);
      testReorder([0, 1, 2, 3], 2, 3, [0, 1, 3, 2]);

      testReorder([0, 1, 2, 3], 3, 0, [3, 0, 1, 2]);
      testReorder([0, 1, 2, 3], 3, 1, [0, 3, 1, 2]);
      testReorder([0, 1, 2, 3], 3, 2, [0, 1, 3, 2]);
      testReorder([0, 1, 2, 3], 3, 3, [0, 1, 2, 3]);
    });
  });
});
