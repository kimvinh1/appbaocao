import { SharedErrorCodePage } from '@/app/components/kb/error-code-page';

export default function ViSinhMaLoiPage() {
    return (
        <div className="mx-auto max-w-5xl">
            <SharedErrorCodePage
                module="vi-sinh"
                title="Tra cứu mã lỗi – Vi Sinh"
                description="Cơ sở dữ liệu lỗi, nguyên nhân và hướng xử lý sự cố cho mảng Vi Sinh."
                instruments={['VITEK 2', 'VITEK MS', 'MicroScan', 'BACT/ALERT']}
                colorClass="text-red-400"
                buttonBgClass="bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-red-400/40"
                focusBorderClass="focus:border-red-400"
            />
        </div>
    );
}
