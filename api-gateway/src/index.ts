require('dotenv').config();
const express = require("express");
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware')
// const {authenticate} = require("./middlewares/authentication")

const port = process.env.API_GATEWAY_PORT || 8080

const app = express();

app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
);

app.use('/user', createProxyMiddleware({
   target: process.env.USER_SERVICE_URL || "http://localhost:8081",
   changeOrigin: true,
   pathRewrite: {'^/user': ''}
}))

app.use('/finops', createProxyMiddleware({
   target: process.env.FINOPS_SERVICE_URL || "http://localhost:8082",
   changeOrigin: true,
   pathRewrite: {'^/finops': ''}
}))

app.use('/notification', createProxyMiddleware({
   target: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8083",
   changeOrigin: true,
   pathRewrite: {'^/notification': ''}
}))

app.use('/report', createProxyMiddleware({
   target: process.env.REPORT_SERVICE_URL || "http://localhost:8084",
   changeOrigin: true,
   pathRewrite: {'^/report': ''}
}))

app.listen(port, () => {
   console.log("Api gateway running in port " + port)
})