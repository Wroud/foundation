export const gitGithubLinks = [
  /[^\w](?<token>#(?<link>\d+)(?<gh>))/gi,
  /[^\w](?<token>GH-(?<link>\d+)(?<gh>))/g,
  /[^\w](?<token>(?<repository>[^\/\s]+\/[^\/\s]+)#(?<link>\d+)(?<gh>))/gi,
];
