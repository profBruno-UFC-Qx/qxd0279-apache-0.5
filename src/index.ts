import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const PORT: number = 8083;
const HOST: string = '127.0.0.1';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// 1. Criação do Servidor TCP (Net.Server)
const server: net.Server = net.createServer((socket: net.Socket) => {
    
    const remoteAddress: string = socket.remoteAddress || 'unknown';
    const remotePort: number = socket.remotePort || 0;

    console.log(`[LOG] Cliente conectado: ${remoteAddress}:${remotePort}`);

    let requestData: string = '';

    
    socket.on('data', (data: Buffer) => {
        requestData += data.toString('utf8');
        console.log(JSON.stringify(requestData))
        
        // Simulação de limite de requisição para evitar ataques
        if (requestData.length > 4096) {
            console.log('[LOG] Requisição muito longa. Fechando socket.');
            socket.end();
        } 
        //Tratar requisição aqui
        socket.end(); 
    });

    socket.on('close', () => {
        console.log(`[LOG] Cliente desconectado: ${remoteAddress}:${remotePort}`);
    });

    socket.on('error', (err: Error) => {
        console.error(`[ERRO] Socket: ${err.message}`);
    });
});



// Inicia o servidor
server.listen(PORT, HOST, () => {
    console.log(`\n*** Servidor Web Primitivo (TCP/TS) rodando em http://${HOST}:${PORT} ***`);
});