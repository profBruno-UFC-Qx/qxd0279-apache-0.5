
## 🚀 Atividade Prática Avançada: Construindo o Apache 0.5 em TypeScript

### 🎯 Objetivo

Implementar um servidor web TCP/Socket em Node.js com TypeScript, que simule a **Segunda Geração** de servidores (pós-CGI inicial), focando na **eficiência** (Keep-Alive) e **robustez** (Serviço de Arquivos Múltiplos e Segurança Básica).

### ⚙️ Pré-requisitos

1.  Ambiente Node.js com TypeScript e `ts-node` configurado.
2.  Módulos `net`, `fs` e `path` do Node.js.
3.  Criação de uma pasta `public` no projeto com os seguintes arquivos de teste:
      * `public/index.html` (para rota `/`)
      * `public/styles.css` (para teste de MIME type)
      * `public/image.png` (para teste de MIME type)
      * `public/404.html` (para erro 404)

### 📋 Tarefa Principal: Implementação Completa (`server-apache.ts`)

O aluno deve começar pelo código base do `server-tcp.ts` (que lida com o TCP cru) e adicionar as seguintes funcionalidades, estruturando o código com funções auxiliares:

#### Requisito 1: Serviço de Arquivos Estáticos e Roteamento (Robustez)

O servidor deve aceitar qualquer caminho GET e tentar mapeá-lo ao diretório `public`.

  * **Roteamento:** Mapear `GET /` para `public/index.html`. Mapear `GET /styles.css` para `public/styles.css`, etc.
  * **MIME Type:** Usar um objeto de mapeamento (`MIME_TYPES`) para enviar o cabeçalho `Content-Type` correto (pelo menos para `.html`, `.css`, `.png`, e um padrão para o resto).
  * **Tratamento de 404:** Se o arquivo não existir (`fs.statSync` falhar), retornar `HTTP/1.1 404 Not Found` com o conteúdo do arquivo `public/404.html`.

#### Requisito 2: Implementação da Segurança Básica (Defesa)

  * **Validação de Requisição (400):** Se a requisição HTTP bruta for mal formada (ex: a primeira linha não tem 3 partes: Método, Path, Versão), retornar imediatamente `HTTP/1.1 400 Bad Request`.
  * **Prevenção de Ataque de Caminho (403):** Se o caminho requisitado (`req.url`) contiver a sequência `..` após a normalização (tentativa de *Directory Traversal*), retornar `HTTP/1.1 403 Forbidden`.

#### Requisito 3: Keep-Alive Básico (Eficiência)

O servidor deve suportar múltiplas requisições na mesma conexão TCP, um grande avanço em performance\!

  * **Análise:** O servidor deve verificar se a requisição é `HTTP/1.1`. Se for, deve assumir **Keep-Alive** (conexão persistente).
  * **Resposta:** Se for Keep-Alive, o servidor **NÃO DEVE** enviar o cabeçalho `Connection: close` e **NÃO DEVE** chamar `socket.end()` após o envio da resposta.
  * **Fechamento por Timeout:** O servidor deve implementar um *timeout* (ex: 5 segundos) no *socket*. Se a conexão ficar inativa (sem receber dados) por esse período, o *socket* deve ser fechado (`socket.end()`).

### 🧪 Teste e Validação

Os alunos devem validar a funcionalidade usando o `curl` (para verificar os cabeçalhos de erro/MIME type) e o `telnet`/`nc` (para testar o Keep-Alive).

1.  **Teste de Robustez (404/MIME):**

    ```bash
    curl -i http://localhost:8080/styles.css  # Deve retornar Content-Type: text/css
    curl -i http://localhost:8080/nao-existe # Deve retornar HTTP/1.1 404 Not Found
    ```

2.  **Teste de Segurança (403):**

    ```bash
    curl -i http://localhost:8080/../server-apache.ts # Deve retornar HTTP/1.1 403 Forbidden
    ```

3.  **Teste de Keep-Alive (Interativo com `nc`/`telnet`):**

      * Conectar: `nc localhost 8080`
      * Enviar a primeira requisição (com Enter duplo).
      * **Em seguida, enviar uma segunda requisição imediatamente, sem fechar a conexão.**
      * A conexão só deve ser fechada automaticamente após o timeout de 5 segundos de inatividade.

-----

### 🌟 Desafio Extra (Opcional)

Implementar uma função `sendErrorResponse(socket, code, status, message)` que garanta que todo erro (400, 403, 404, 500) envie uma resposta HTTP bem formada e feche a conexão corretamente.

**Com esta atividade, os alunos terão construído uma réplica funcional dos servidores que dominaram a web no final dos anos 90, compreendendo as trade-offs e a complexidade que os frameworks modernos resolvem.**