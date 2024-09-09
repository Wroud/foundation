export function semverRegex(prefix = "v") {
  return new RegExp(
    `(?<=^${prefix}?|\\s${prefix}?)(?:(?:0|[1-9]\\d{0,9}?)\\.){2}(?:0|[1-9]\\d{0,9})(?:-(?:--+)?(?:0|[1-9]\\d*|\\d*[a-z]+\\d*)){0,100}(?=$| |\\+|\\.)(?:(?<=-\\S+)(?:\\.(?:--?|[\\da-z-]*[a-z]\\d*|0|[1-9]\\d*)){1,100}?)?(?!\\.)(?:\\+(?:[\\da-z]\\.?-?){1,100}?(?!\\w))?(?!\\+)`,
    "gi",
  );
}
