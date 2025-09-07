const readline = require('readline').createInterface({
    input: process.stdin,  //entrada teclado
    output: process.stdout //saída terminal 
});

//array principal que vai ser o db
const alunos = [];


//funcs auxiliares

/**
 * @param {string} promptText O texto da pergunta a ser exibida para o usuário
 * @returns {Promise<string>} Promise que resolve com a resposta do usuário
 */

function lerInput(promptText) {
    //usa uma promise para encapsular a operação assíncrona de readline.question
    return new Promise(resolve => {
        readline.question(promptText, answer => {
            //quando o usuário responde, a promise é resolvida com a resposta
            //trim()remove espaços em branco do início e do fim
            resolve(answer.trim());
        });
    });
}

//func menu
function exibirMenu() {
    console.log(`
    --- Gerenciador de Turma ---
    1. Adicionar aluno
    2. Listar alunos
    3. Registrar notas para um aluno
    4. Calcular média de um aluno
    5. Mostrar aprovados (média >= 7)
    6. Mostrar estatísticas da turma
    7. Ordenar alunos por média
    8. Remover aluno
    9. Sair
    -------------------------------`);
}


//funcionalidades menu

//lógica add aluno
async function adicionarAluno() {
    //await pausa a função até que lerInput resolva a promise com o nome digitado
    const nome = await lerInput("Digite o nome do aluno: ");
    if (!nome) { //garantir que o nome não seja vazio
        console.log("O nome não pode ser vazio.");
        return; //encerra a função se o nome for inválido
    }

    //procura por um aluno existente ignorando maiúsculas/minúsculas para evitar duplicação de aluno
    const alunoExistente = alunos.find(aluno => aluno.nome.toLowerCase() === nome.toLowerCase());

    if (alunoExistente) {
        console.log("\nErro: Já existe um aluno com este nome.");
    } else {
        //add um novo objeto de aluno ao array principal
        alunos.push({ nome: nome, notas: [] });
        console.log(`\nAluno ${nome} adicionado com sucesso.`);
    }
}

//exibe todos os alunos cadastrados
function listarAlunos() {
    if (alunos.length === 0) { //vê se tem alunos antes de tentar listar
        console.log("\nNenhum aluno cadastrado.");
        return;
    }

    console.log("\n--- Lista de Alunos ---");
    //itera sobre o array de alunos e exibe o nome de cada um
    alunos.forEach(aluno => {
        console.log(`- ${aluno.nome} (${aluno.notas.length} notas registradas)`);
    });
}

//adiciona notas a um aluno específico
async function adicionarNotas() {
    const nome = await lerInput("Digite o nome do aluno para registrar notas: ");
    const aluno = alunos.find(a => a.nome.toLowerCase() === nome.toLowerCase());

    if (!aluno) {
        console.log("\nAluno não encontrado.");
        return;
    }

    const notasStr = await lerInput("Digite as notas separadas por vírgula: ");
    //transforma a string de entrada; ex: "7.5, 8" em um array de strings; ex: ["7.5", " 8"]
    const notasArray = notasStr.split(',');
    const notasValidas = [];
    const notasInvalidas = [];

    //itera cada nota digitada para validar e converter para número
    notasArray.forEach(notaStr => {
        const notaNum = parseFloat(notaStr.trim());//converte string para número de ponto flutuante
        //verifica se é um número válido e se tá entre 0 e 10
        if (!isNaN(notaNum) && notaNum >= 0 && notaNum <= 10) {
            notasValidas.push(notaNum);
        } else {
            notasInvalidas.push(notaStr);
        }
    });

    if (notasValidas.length > 0) {
        //o operador ... adiciona todos os itens de notasValidas ao array de notas do aluno
        aluno.notas.push(...notasValidas);
        console.log(`\nNotas adicionadas com sucesso para ${aluno.nome}.`);
    }

    if (notasInvalidas.length > 0) {
        //fala pro usuário quais notas não eram válidas e foram ignoradas
        console.log(`\nAtenção: Os seguintes valores são inválidos e foram ignorados: ${notasInvalidas.join(', ')}`);
    }
}

/**
@param {object} aluno objeto do aluno com a propriedade notas
@returns {number|null} retorna a média ou null se não tiver notas
 */
function calcularMedia(aluno) {
    if (aluno.notas.length === 0) {
        return null; //return null para indicar que o cálculo não deu certo
    }
    //reduce é usado para somar todos os elementos de um array
    const soma = aluno.notas.reduce((acc, nota) => acc + nota, 0);
    return soma / aluno.notas.length;
}

//func que interage com o usuário para calcular e exibir a média de um aluno específico

async function calcularMediaDeAluno() {
    const nome = await lerInput("Digite o nome do aluno para calcular a média: ");
    const aluno = alunos.find(a => a.nome.toLowerCase() === nome.toLowerCase());

    if (!aluno) {
        console.log("\nAluno não encontrado.");
        return;
    }

    const media = calcularMedia(aluno); //reusa a função de cálculo
    if (media === null) {
        console.log(`\nO aluno ${aluno.nome} ainda não possui notas.`);
    } else {
        // toFixed(2) formata o número para ter apenas duas casas decimais
        console.log(`\nMédia de ${aluno.nome}: ${media.toFixed(2)}`);
    }
}


function mostrarAprovados() {
    const aprovados = alunos
        //map() transforma o array original em um novo array com o nome e a média de cada aluno
        .map(aluno => ({ nome: aluno.nome, media: calcularMedia(aluno) }))
        //filter() cria um terceiro array contendo apenas os alunos com média válida e >= 7
        .filter(aluno => aluno.media !== null && aluno.media >= 7);

    if (aprovados.length === 0) {
        console.log("\nNão há alunos aprovados ou com notas suficientes para o cálculo.");
        return;
    }

    console.log("\n--- Alunos Aprovados (Média >= 7) ---");
    aprovados.forEach(aluno => {
        console.log(`- ${aluno.nome}: Média ${aluno.media.toFixed(2)}`);
    });
}

//calcula e exibe as estatísticas gerais da turma

function exibirEstatisticas() {
    //primeiro cria uma lista só com os alunos que tem notas e médias
    const alunosComNotas = alunos
        .map(aluno => ({ nome: aluno.nome, media: calcularMedia(aluno) }))
        .filter(aluno => aluno.media !== null);

    if (alunosComNotas.length === 0) {
        console.log("\nSem dados. Nenhum aluno possui notas para gerar estatísticas.");
        return;
    }

    //reduce para calcular a média geral da turma
    const totalMedias = alunosComNotas.reduce((acc, aluno) => acc + aluno.media, 0);
    const mediaGeral = totalMedias / alunosComNotas.length;
    //reduce para encontrar o objeto com a maior média
    const maiorMedia = alunosComNotas.reduce((maior, aluno) => (aluno.media > maior.media ? aluno : maior));
    //reduce para encontrar o objeto com a menor média
    const menorMedia = alunosComNotas.reduce((menor, aluno) => (aluno.media < menor.media ? aluno : menor));

    console.log("\n Estatísticas da Turma ");
    console.log(`Média Geral: ${mediaGeral.toFixed(2)}`);
    console.log(`Maior Média: ${maiorMedia.nome} (Média: ${maiorMedia.media.toFixed(2)})`);
    console.log(`Menor Média: ${menorMedia.nome} (Média: ${menorMedia.media.toFixed(2)})`);
}


//exibe a lista de alunos ordenada pela média
function listarOrdenadoPorMedia() {
    if (alunos.length === 0) {
        console.log("\nNenhum aluno cadastrado para ordenar.");
        return;
    }
    //cria cópia do array
    //ordena com sort e modifica o array original então mexemos com uma cópia
    const alunosCopia = JSON.parse(JSON.stringify(alunos));

    //calcula e adiciona a média a cada aluno na cópia
    alunosCopia.forEach(aluno => {
        aluno.media = calcularMedia(aluno);
    });

    //ordena a cópia
    alunosCopia.sort((a, b) => {
        if (a.media === null) return 1;  //coloca alunos sem média para o final da lista
        if (b.media === null) return -1; //mantem alunos sem média no final
        return b.media - a.media; //ordena decrescente
    });

    console.log("\n Alunos Ordenados por Média (decrescente)" );
    alunosCopia.forEach(aluno => {
        const mediaStr = aluno.media !== null ? aluno.media.toFixed(2) : "Sem notas";
        console.log(`- ${aluno.nome} | Média: ${mediaStr}`);
    });
}

//remove aluno da lista

async function removerAluno() {
    const nome = await lerInput("Digite o nome do aluno a ser removido: ");
    //findIndex() retorna a posição do elemento no array
    const index = alunos.findIndex(a => a.nome.toLowerCase() === nome.toLowerCase());

    if (index !== -1) {//se o index for diferente de -1; o aluno foi encontrado
        const nomeRemovido = alunos[index].nome;
        //splice() muda o array original, removendo elementos; aqui remove 1 elemento na posição index.
        alunos.splice(index, 1);
        console.log(`\nAluno ${nomeRemovido} removido com sucesso.`);
    } else {
        console.log("\nAluno não encontrado.");
    }
}


/**
 *é declarada como async para poder usar await dentro dela
 */
async function main() {
    let sair = false;
    //loop principal continua executando até que o usuário decida sair
    while (!sair) {
        exibirMenu();
        const opcao = await lerInput("Escolha uma opção: ");

        //switch direciona o programa para a função correta com base na escolha do user
        switch (opcao) {
            case '1':
                await adicionarAluno();
                break;
            case '2':
                listarAlunos();
                break;
            case '3':
                await adicionarNotas();
                break;
            case '4':
                await calcularMediaDeAluno();
                break;
            case '5':
                mostrarAprovados();
                break;
            case '6':
                exibirEstatisticas();
                break;
            case '7':
                listarOrdenadoPorMedia();
                break;
            case '8':
                await removerAluno();
                break;
            case '9':
                sair = true; //muda a condição do loop para que ele termine na próxima iteração
                break;
            default:
                console.log("\nOpção inválida. Por favor, tente novamente.");
                break;
        }

        if (!sair) {
            //pausa o programa e espera o usuário pressionar ENTER para continuar
            await lerInput("\nPressione ENTER para continuar...");
        }
    }
    console.log("\nEncerrando o programa...");
    readline.close();
}
main();