// const VerifyEmailTemplate = ({name, url}) => {
//     return
//     `hiiii
//     <h3>Dear ${name}</h3>
//     <p>Thank you for registering Blinkit</p>
//     <a href=${url} style="color:white;background:blue margin-top:40px">Verify Email</a>
//     `
// }

// export default VerifyEmailTemplate


const verifyEmailTemplate = ({ name, url }) => {
    return `
<p>Dear ${name}</p>    
<p>Thank you for registering Binkeyit.</p>   
<a href=${url} style="color:black;background :orange;margin-top : 10px,padding:20px,display:block">
    Verify Email
</a>
`
}

export default verifyEmailTemplate