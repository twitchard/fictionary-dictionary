import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  createRef
} from "react";

// "Slides" the element at "from" in the list after the element at "to".
export const reorder = (list, from, to) => {
  const copy = [...list];
  if (to === from) return copy;
  if (from === null) return copy;
  if (to === null) return copy;
  if (to < from) {
    copy.splice(from, 1);
    copy.splice(to, 0, list[from]);
    return copy;
  }
  copy.splice(to + 1, 0, list[from]);
  copy.splice(from, 1);
  return copy;
};

// Returns the index of the number in the array of numbers that is closest to "mark"
const closest = (mark, arr) => {
  if (arr.length < 1) {
    throw new Error("Unexpected: no draggables");
  }
  const distances = arr.map(x => Math.abs(mark - x));
  const minDistance = distances.reduce(
    (acc, cur) => Math.min(acc, cur),
    Infinity
  );
  for (let i = 0; i < arr.length; i++) {
    if (distances[i] === minDistance) {
      return i;
    }
  }
};

const DragList = ({ draggables, handleReorder, debug }) => {
  const [dragee, setDragee] = useState(null);
  const [dragUnder, setDragUnder] = useState(null);
  const [dragCoords, setDragCoords] = useState(null);
  const onDragEnd = useRef();
  onDragEnd.current = useCallback(() => {
    const ret = reorder(draggables.map((_, i) => i), dragee, dragUnder);
    if (debug) console.log(dragee, dragUnder);
    if (debug) console.log("reorder", ret);
    if (dragee !== dragUnder) {
      handleReorder(ret);
    }
    setDragee(null);
    setDragCoords(null);
    setDragUnder(null);
  }, [dragee, dragUnder]);
  const refs = useRef(draggables.map(() => createRef()));
  const onDragStart = n => e => {
    setTimeout(() => {
      setDragee(n);
      const rects = refs.current
        ? refs.current
            .map(x => x.current && x.current.getBoundingClientRect())
            .filter(Boolean)
        : [];
      const coords = [
        rects[0].y,
        ...rects.map(rect => rect.y + rect.height + window.pageYOffset)
      ];
      setDragCoords(coords);
    }, 0);
    e.target.addEventListener("dragend", () => onDragEnd.current(), {
      once: true
    });
  };
  const onDragOver = e => {
    const newDragUnder = closest(e.pageY, dragCoords);
    if (newDragUnder !== dragUnder) setDragUnder(newDragUnder);
  };
  const defaultOrder = draggables.map((_, i) => i);
  const ordering =
    dragee !== null && dragUnder !== null
      ? reorder(defaultOrder, dragee, dragUnder)
      : defaultOrder;

  return (
    <div onDragOver={onDragOver}>
      {debug && (
        <pre key="pre">{`
dragee: ${dragee}
dragUnder: ${dragUnder}
      `}</pre>
      )}
      {ordering.map(i => (
        <div
          key={i}
          draggable={true}
          onDragStart={onDragStart(i)}
          onTouchMove={e => {
            e.preventDefault();
          }}
          ref={refs.current[i]}
        >
          {draggables[i]}
        </div>
      ))}
    </div>
  );
};
export default DragList;
