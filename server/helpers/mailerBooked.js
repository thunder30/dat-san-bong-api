const nodemail = require('nodemailer')
const inlineBase64 = require('nodemailer-plugin-inline-base64');

const mailer = {
    sendMail (receiver, code, startTime, endTime, address, pitch, price, url) {
        // console.log(url)
        // console.log(typeof url)
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
        transporter.use('compile', inlineBase64());
        const help = `https://www.facebook.com/it.nnt`
        //split " "
        const day = startTime.split(' ')[0] 
        const _startTime = startTime.split(' ')[1]
        const _endTime = endTime.split(' ')[1]
        const htmlContent = `
            <div>
                <p>Xin chào <b>${receiver}</b>,</p>
                <p>Cảm ơn bạn đã đặt sân của chúng tôi<br>
                Vào ngày ${day} thời lượng ${_startTime} - ${_endTime} <br>
                Tại địa chỉ: ${address}<br>
                Ở sân: ${pitch}<br>
                Giá đã thanh toán tiền là: ${price}</b><br>
                Mã code để vào sân là: <b>${code}</b><br>
                </b>Hoặc bạn có thể quét mã QR này khi vào sân</b> <br>
                <img src="${url}" alt="QR Code" style="width: 100px; height: 100px;">
                </p>
                <p>Nếu có gì sai sót vui lòng liên hệ với chúng tôi <a href=${help} style="text-decoration: none">tại đây</a></p>
                <p>Trân trọng,<br>Đội ngũ Thunder.</p>
            </div>
        `

        // const buffer = Buffer.from(s.split("base64,")[1], "base64");
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

const sendMailBooked = (receiver, code, startTime, endTime, address, pitch, price, url) => {
    mailer.sendMail(receiver, code, startTime, endTime, address, pitch, price, url)
}

module.exports = sendMailBooked