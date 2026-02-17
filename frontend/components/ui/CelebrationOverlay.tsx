import React, { useEffect, useState } from 'react';

const CELEBRATION_GIFS = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGduenBibmljYWZyMHFrNHJ1NHVwY204YnIwcGx1MTloZWltdmhhNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGduenBibmljYWZyMHFrNHJ1NHVwY204YnIwcGx1MTloZWltdmhhNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bIEzoZX0qJaG6s6frc/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGduenBibmljYWZyMHFrNHJ1NHVwY204YnIwcGx1MTloZWltdmhhNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/s2qXK8wAvkHTO/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGduenBibmljYWZyMHFrNHJ1NHVwY204YnIwcGx1MTloZWltdmhhNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/o75ajIFH0QnQC3nCeD/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGduenBibmljYWZyMHFrNHJ1NHVwY204YnIwcGx1MTloZWltdmhhNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/doPrWYzSG1Vao/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmJ5bmJnaHlhdXA5YWw4a3F3d2tvc3k5ZHd2YmdscHVmODgyMXBrZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JpG2A9P3dPHXaTYrwu/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmJ5bmJnaHlhdXA5YWw4a3F3d2tvc3k5ZHd2YmdscHVmODgyMXBrZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LCdPNT81vlv3y/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmJ5bmJnaHlhdXA5YWw4a3F3d2tvc3k5ZHd2YmdscHVmODgyMXBrZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cXMFmN3edhlHI5vRsG/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmJ5bmJnaHlhdXA5YWw4a3F3d2tvc3k5ZHd2YmdscHVmODgyMXBrZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hAcDHEhZHA2bu/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmJ5bmJnaHlhdXA5YWw4a3F3d2tvc3k5ZHd2YmdscHVmODgyMXBrZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MAA3oWobZycms/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3hvYTAxbXM3YmF6bHJpbGZwbXhxMW52dmF3Z3dmbHZkaHB0bW9lbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o6gDWzmAzrpi5DQU8/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cDRsamhobTlwYTN5enBzbnNzeWl2cHVhOG5qcHJyY2g3ZGJ2dGY0biZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UsTNoiGR7OBsDcUvuG/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzBpZGV5a3lheDc1em9xOW9obXY2MXdwZTI2Ym9hdmZkODF1bmh6aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/IzRdtacpXlEH3XD2n6/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzBpZGV5a3lheDc1em9xOW9obXY2MXdwZTI2Ym9hdmZkODF1bmh6aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3V0B6ICVWbg8Xi5q/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dm0zcXZlYTFhMXlkbXQ2NTR6ZWQ5MXllM29ndzAyeGNmYTgza3lhZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YhwrU6vgKs60jsAPzb/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cjh4cG9iMm5yYXFxZTM3YXgwcWo4dThkcWo2c29peW9lZGg1Z3ZkeiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/X5cAKRomD50t3d04ke/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Zjg1Yzg3cXU1enJ2aHJlanFhZTNtbGk3OWRyaHBmdWlyanZxbjAybSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tsFUnVbWMQeoIsHD2K/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Zjg1Yzg3cXU1enJ2aHJlanFhZTNtbGk3OWRyaHBmdWlyanZxbjAybSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZmJdAUdWZaw9hHUKeN/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MzlzaGw5NXppN3BnZzl3eXg2c2VlZnVuanphZzZ3Z3FneDczZTd5ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2JeaWUfi9lHyT24U/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MzlzaGw5NXppN3BnZzl3eXg2c2VlZnVuanphZzZ3Z3FneDczZTd5ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XGP7mf38Vggik/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eTkxbGp2NXR0NGVoa21sNWw0MTR1OXlnMHhiYmxyZ2k5dWZxaDY4eiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MkvZFvzHIWbRK/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWNndXQ0N2Z1aDVyNHdiaW45emNuMnhmcmo4cHk0ZmhmMmx4aG00ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/AErExHJVxRbkm5hPkB/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWNndXQ0N2Z1aDVyNHdiaW45emNuMnhmcmo4cHk0ZmhmMmx4aG00ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2LYuLLpo7LaX9Eru8j/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWNndXQ0N2Z1aDVyNHdiaW45emNuMnhmcmo4cHk0ZmhmMmx4aG00ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lXC2gmHf2ypUs/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWNndXQ0N2Z1aDVyNHdiaW45emNuMnhmcmo4cHk0ZmhmMmx4aG00ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/w1eatlCL6TSFnt7jjU/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cHNxa29vb2c3bXcxa2hvMXpmeDV1aTB1c2s4Mmgyb3NlY2EwYzV1ZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/dYVtYHhzrAZVdhlwJE/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bGQ3a2g3eWR4bmQ3dWIwdHA4eTk0NTM1djdjcmE4NGxmbmg4ODVmZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1sVZ8ViZA9DLZNoMt3/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdm9ldng5cnYxZTN6b3FlejRiMWY0aHowY2F2MDhoZ3BlNnBsNjlvNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/AWFz1vFPojxseMy8JA/giphy.gif"
];

interface CelebrationOverlayProps {
    show: boolean;
    onComplete: () => void;
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ show, onComplete }) => {
    const [gifUrl, setGifUrl] = useState('');

    useEffect(() => {
        if (show) {
            const randomGif = CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)];
            setGifUrl(randomGif);

            const timer = setTimeout(() => {
                onComplete();
            }, 3000); // Show for 3 seconds

            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative p-4 animate-in zoom-in duration-500">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-success opacity-50 blur-2xl animate-pulse"></div>
                <img
                    src={gifUrl}
                    alt="Celebration!"
                    className="relative rounded-2xl shadow-ios-xl max-w-[90vw] max-h-[70vh] object-contain border-4 border-white/20"
                />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-center w-full">
                    <h2 className="text-4xl font-black text-white drop-shadow-lg tracking-tighter animate-bounce italic">
                        PAYMENT RECORDED! 💰
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default CelebrationOverlay;
