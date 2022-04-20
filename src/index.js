const express = require ('express');
const { v4: uuidv4 } = require ('uuid');

const app = express();

app.use(express.json());

const customers = [];

//Middleware. Validação de Conta basicamente 
function verifyIfExistsAccountCpf(request, response, next){
    const { cpf } = request.headers;
    console.log(request);
    const customer = customers.find((customer) => customer.cpf === (cpf));

    if(!customer) {
        return response.status(400).json({ error: "Customer Not Found" });
    };

    request.customer = customer;
    
    return next();
}

//Função para verificar o saldo da conta
function getBalance(statement){
   const balance = statement.reduce((acc, operation)=>{
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    },0);

    return balance;
}

//Cadastro de conta
app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if(customerAlreadyExists){
        return response.status(400).json({error: "Customer Alredy exists!"})
    };

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })
    return response.status(201).send();
});

//Listando Extrato
app.get("/statement", verifyIfExistsAccountCpf, (request, response) => {
    const { customer } = request;

    return response.json(customer.statement);
});

//Criando deposito
app.post("/deposit", verifyIfExistsAccountCpf, (request, response) => {
    const {description, amount} = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

//Criando Saque
app.post("/withdraw", verifyIfExistsAccountCpf, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).json({error: "Insufficient Funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

//Listando Extrato Bancário por Data
app.get("/statement/date", verifyIfExistsAccountCpf, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString()
    );

    return response.json(customer.statement);
});

//Atualizando os dados do cliente
app.put("/account", verifyIfExistsAccountCpf, (request, response) =>{
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;
 
    return response.status(201).send();
});

//Pegar dados da conta
app.get("/account", verifyIfExistsAccountCpf, (request,response)=> {
    const { customer } = request;

    return response.json(customer);
});

//Deletando a conta
app.delete("/account", verifyIfExistsAccountCpf, (request,response)=>{
    const { customer } = request;

    //splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

//Pegando o saldo da conta
app.get("/balance", verifyIfExistsAccountCpf, (request,response) =>{
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});
//local host (6767)
app.listen(6767);