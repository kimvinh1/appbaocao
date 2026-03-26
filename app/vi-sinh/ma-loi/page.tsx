import { SharedErrorCodePage } from '@/app/components/kb/error-code-page';

export default function ViSinhMaLoiPage() {
    return (
        <div className="mx-auto max-w-5xl">
            <SharedErrorCodePage
                module="vi-sinh"
                                title="Mã lỗi Vi Sinh"
                                description="Cơ sở dữ liệu lỗi, nguyên nhân và hướng xử lý sự cố cho mảng Vi Sinh (Beckman Coulter)."
                                instruments={['Walkaway-96', 'Walkaway-48', 'Autoscan 4', 'Thiết bị khác']}
                colorClass="text-red-400"
                buttonBgClass="bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-red-400/40"
                focusBorderClass="focus:border-red-400"
            />
        </div>
    );
}
