import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { HTTPResponseBuilder, parseRequest } from './http/index.js';

const PORT: number = 8083;
const HOST: string = '127.0.0.1';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server: net.Server = net.createServer((socket: net.Socket) => {
    

    const remoteAddress: string = socket.remoteAddress || 'unknown';
    const remotePort: number = socket.remotePort || 0;

    console.log(`[LOG] Cliente conectado: ${remoteAddress}:${remotePort}`);

    // Buffer para armazenar os dados da requisição
    let requestData: string = '';

    // O evento 'data' é disparado quando o cliente (navegador) envia dados.
    socket.on('data', (data: Buffer) => {
        requestData += data.toString('utf8');
        console.log(`[LOG] Dados recebidos ${JSON.stringify(requestData)}`)
        
        // Simulação de limite de requisição para evitar ataques
        if (requestData.length > 4096) {
            console.log('[LOG] Requisição muito longa. Fechando socket.');
            socket.end();
        } else if (requestData.includes('\r\n\r\n')) {
            processRequest(requestData, socket);
        }
        
    });

    socket.on('close', () => {
        console.log(`[LOG] Cliente desconectado: ${remoteAddress}:${remotePort}`);
    });

    socket.on('error', (err: Error) => {
        console.error(`[ERRO] Socket: ${err.message}`);
    });
});

/**
 * Processa a requisição HTTP bruta e envia a resposta.
 * @param requestString A string bruta da requisição HTTP.
 * @param socket O socket de conexão para escrever a resposta.
 */
function processRequest(requestString: string, socket: net.Socket): void {
    
    const request = parseRequest(requestString)
    console.log(`[REQ] ${request.method || '??'} ${request.path || '??'}`);
    
    if (request.method === 'GET') {

        const requestedPath = request.path === '/' ? '/index.html' : request.path;
        if (requestedPath.indexOf('..') !== -1) {
            socket.write(new HTTPResponseBuilder()
            .forbidden()
            .build().message
            )
        } else {

            const filePath = path.join(__dirname, '../public', requestedPath);
            try {
    
                const fileContent: Buffer = fs.readFileSync(filePath);
    
                const response = new HTTPResponseBuilder()
                .statusCode(200)
                .httpVersion('1.1')
                .reasonPhrase('OK')
                .header('Content-Type', 'text/html')
                .header('Content-Length', `${fileContent.length}`)
                .header('Connection', 'close')
                .payload(fileContent.toString())
                .build()
    
                socket.write(response.message)
            
                
    
            } catch (error) {
                console.error('[ERRO] Erro ao ler arquivo:', (error as Error).message);
                const errorResponse: string = 'HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nFile Not Found';
                socket.write(errorResponse);
            }
        }

    } else {
        const notImplemented: string = 'HTTP/1.1 501 Not Implemented\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n501 Not Implemented';
        socket.write(notImplemented);
    }

    socket.end(); 
}


// Inicia o servidor
server.listen(PORT, HOST, () => {
    console.log(`\n*** Servidor Web Primitivo (TCP/TS) rodando em http://${HOST}:${PORT} ***`);
});