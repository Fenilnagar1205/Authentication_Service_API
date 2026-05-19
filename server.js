import express from 'express'
const app = express();

app.use(express.json());

app.get('/',(req,res)=> {
    res.send('Hello From Express!')
})

//Start Server
const PORT = 5000;
app.listen(PORT,( )=>{
    console.log(`Server Listening on Port ${PORT}`)
} )
