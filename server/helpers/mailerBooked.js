const nodemail = require('nodemailer')

const mailer = {
    sendMail(receiver, code, startTime, endTime, address, pitch, price) {
        const optionOne = {
            service: 'Gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        }
        const optionTwo = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        }
        const optionThree = {
            pool: true,
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        }
        const transport = optionThree
        let transporter = nodemail.createTransport(transport)
        const help = `https://www.facebook.com/it.nnt`
        const htmlContent = `
            <div>
                <p>Xin chào <b>${receiver}</b>,</p>
                <p>Cảm ơn bạn đã đặt sân của chúng tôi<br>
                Thời gian bắt đầu là: ${startTime} và kết thúc vào lúc ${endTime}<br>
                Tại địa chỉ: ${address}<br>
                Ở sân: ${pitch}<br>
                Mã code để bạn xác thực là: <b>${code}</b><br>
                Giá đã thanh toán tiền là: ${price}</b>
                </p>
                <p>Nếu có gì sai sót vui lòng liên hệ với chúng tôi <a href=${help} style="text-decoration: none">tại đây</a></p>
                <p>Trân trọng,<br>Đội ngũ Thunder.</p>
            </div>
        `

        const mailOptions = {
            from: `Thunder Team <${process.env.MAIL_USER}>`,
            to: receiver,
            subject: `Đơn đặt sân!`,
            html: htmlContent,
        }
        // transporter.verify(function (error, success) {
        //
        // })
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.log(err)
            else console.log(`Email send ${receiver}: ${info.response}`)
        })
    },
}

const sendMailBooked = (receiver, code, startTime, endTime, address, pitch, price) => {
    mailer.sendMail(receiver, code, startTime, endTime, address, pitch, price)
}

module.exports = sendMailBooked