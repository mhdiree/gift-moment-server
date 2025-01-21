require('dotenv').config();

const express = require('express');
const path = require('path');
const paymentRoutes = require('./src/payments/routes/payment.routes');
const letterRoutes = require('./src/letters/routes/letter.routes');
const authRoutes = require('./src/auth/routes/authRoutes');
const accountRoutes = require('./src/auth/routes/accountRoutes');
const mypageRoutes = require('./src/mypage/routes/mypageRoutes');
const wishlistRoutes = require('./src/wishlist/routes/wishlistRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.set('port', process.env.PORT || 3000);

app.use('/api/v1', paymentRoutes);
app.use('/api/v1', letterRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1/auth', accountRoutes);
app.use('/api/v1/mypage', mypageRoutes);
app.use('/api/v1/wishlists', wishlistRoutes);


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});