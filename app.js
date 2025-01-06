require('dotenv').config();
const express = require('express');
const paymentRoutes = require('./src/payments/routes/payment.routes');
const letterRoutes = require('./src/letters/routes/letter.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('port', process.env.PORT || 3000);

app.use('/api/v1', paymentRoutes);
app.use('/api/v1', letterRoutes);

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});