export function lerp(a, b, t){ return a + (b - a) * t; }
export function smooth(prev, next, alpha=0.2){
  return prev == null ? next : lerp(prev, next, alpha);
}
