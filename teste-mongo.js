const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://alisoncavani365_db_user:Z9wSciHpuAay7cza@cluster0.mongodb.net/?retryWrites=true&w=majority";

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Conectado com sucesso!");
    await client.close();
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testConnection();