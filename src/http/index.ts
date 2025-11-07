import strict from "node:assert/strict"
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "CONNECT", "TRACE", "OPTIONS"] as const
type HttpMethod = typeof methods[number]

type RequestLine = {
  method: HttpMethod,
  path: string,
  httpVersion: string
}

type RequestHeaders = "Host" | "User-Agent" | "Accept" | "Accept-Language" | "Accept-Encoding" | "Connection" | "Cache-Control"
type ResponseHeaders = "Content-Type" | "Content-Encoding" | "Date" | "Keep-Alive"| "Server" | "Set-Cookie"
type PayloadHeares = "Content-Length" | "Content-Range"

type HttpHeaders = Record<RequestHeaders | ResponseHeaders | PayloadHeares, string>

const emptyLine = '\r\n'

type HTTPRequest = RequestLine & {
   headers?: { 
    [K in keyof HttpHeaders]? : string
   },
   payload?: string
}

function isValidMethod(m: string): m is HttpMethod {
  return methods.includes(m as HttpMethod)
}

export function parseRequest(data: string): HTTPRequest {
  const request = data.split('\n');
  const requestLine = request[0]
  const [method, path, version] = requestLine ? requestLine.trim().split(' ') : [];

  if(method && isValidMethod(method) && path && version) {
    const headers: {[K in keyof HttpHeaders]? : string } = {}
    for(const line of request.slice(1)) {
      if(line && line.trim()) {
        const [ header, headerValue] = line.split(':')
        if(header) {
          headers[header as keyof HttpHeaders] = (headerValue ?? '').trim()
        }
      }
    }


    return {
      method,
      path: path,
      httpVersion: version,
      headers
    }
  }
  throw Error


}


class HTTPResponse {
  constructor(
    private statusCode: number,
    private reasonPhrase: string,
    private httpVersion: string,
    private headers?: { 
    [K in keyof HttpHeaders]? : string
   },
    private payload: string = "") {}

  private get statusLine(): string {
    return `${this.httpVersion} ${this.statusCode} ${this.reasonPhrase}\r\n`
  }

  private get header(): string {
    let result = ""
    if(this.headers) {
      result = Object.entries(this.headers).reduce((p, [k, v]) => `${p}${k}:${v}\r\n`, "");
    }
    return `${result}\r\n`
  }

  get message(): string {
    return `${this.statusLine}${this.header}${this.payload}`
  }
}

export class HTTPResponseBuilder {
  private _statusCode!: number;
  private _reasonPhrase!: string;
  private _httpVersion!: string;
  private _payload?: string;
  private _headers?: { 
    [K in keyof HttpHeaders]? : string
   } = {}

  statusCode(code: number): this {
    this._statusCode = code;
    return this;
  }

  reasonPhrase(phrase: string): this {
    this._reasonPhrase = phrase;
    return this;
  }

  httpVersion(version: string): this {
    this._httpVersion = `HTTP/${version}`;
    return this;
  }

  payload(payload: string): this {
    this._payload = payload;
    return this;
  }

  header(header: keyof HttpHeaders, value: string): this {
    if(this._headers) {
      this._headers[header] = value
    }
    return this
  }

  forbidden(version: string = '1.1'): this {
    this._statusCode = 403
    this._reasonPhrase = 'Forbiden'
    this.httpVersion(version)
    return this
  }

  notFound(version: string = '1.1'): this {
    this._statusCode = 404
    this._reasonPhrase = 'Not Found'
    this.httpVersion(version)
    this.header('Content-Type', 'text/plain')
    this.header('Connection', 'close')
    return this
  }

  serverError(version: string = '1.1'): this {
    this._statusCode = 500
    this._reasonPhrase = 'Internal Server Error'
    this.httpVersion(version)
    this.header('Content-Type', 'text/plain')
    this.header('Connection', 'close')
    return this
  }

  build(): HTTPResponse {
    return new HTTPResponse(this._statusCode, this._reasonPhrase, this._httpVersion, this._headers ,this._payload);
  }
}