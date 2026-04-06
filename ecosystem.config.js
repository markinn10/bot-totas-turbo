module.exports = {
  apps : [
    {
      name: "meu-bot-1",
      script: "./bot.js",
      cwd: "/home/ubuntu/meu-bot",
      env: {
        BOT_ID: "bot-1", // Identificador único
        NUMERO_AVISO: "556185123885@c.us", // Seu número
        INICIO_TURNO: 19,
        FIM_TURNO: 13
      }
    },
    {
      name: "meu-bot-2",
      script: "./bot.js",
      cwd: "/home/ubuntu/meu-bot",
      env: {
        BOT_ID: "bot-2", // Mude o ID para não confundir os logs
        NUMERO_AVISO: "556199999999@c.us", // Pode ser outro número de aviso ou o mesmo
        INICIO_TURNO: 19,
        FIM_TURNO: 13
      }
    }
  ]
}
