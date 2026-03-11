export const initSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("Client Connected")

    socket.on("disconnect", () => {
      console.log("Client Disconnected")
    })

  })

}