const nodemail = require('nodemailer')

const mailer = {
    sendMail(receiver, url) {
        let transporter = nodemail.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        })

        const htmlContent = `
            <div>
                <p>Xin chào <b>${receiver}</b>,</p>
                <p>Bạn có tài khoản vừa được đăng ký.<br>
                Nhấn <a href=${url} style="text-decoration: none">tại đây</a> để xác nhận tài khoản email của bạn.
                </p>
                <p>Nếu đó không phải là bạn, vui lòng liên hệ với chúng tôi <a href=${url} style="text-decoration: none">tại đây</a></p>
                <p>Trân trọng,<br>Đội ngũ Thunder</p>
            </div>
        `

        const mailOptions = {
            from: `Thunder Team <${process.env.MAIL_USER}>`,
            to: receiver,
            subject: `Xác nhận tài khoản của bạn!`,
            html: htmlContent,
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.log(err)
            else console.log(`Email send: ${info.response}`)
        })
    },
}

module.exports = mailer
