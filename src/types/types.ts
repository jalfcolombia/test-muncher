export type LambdaResponse = {
  headers: HeaderOption;
  statusCode: number;
  body: any;
};

interface HeaderOption {
  'Access-Control-Allow-Origin': string;
  'Content-Type': string;
}
