import { SharedSupportCasePage } from '@/app/components/kb/support-case-page';

export default function ViSinhCasePage() {
    return (
        <div className="mx-auto max-w-5xl">
            <SharedSupportCasePage
                module="vi-sinh"
                title="Nhật Ký Hỗ Trợ – Vi Sinh"
                description="Ghi nhận và theo dõi các case hỗ trợ kỹ thuật về máy định danh vi khuẩn, kháng sinh đồ."
                instruments={['VITEK 2', 'VITEK MS', 'MicroScan', 'BACT/ALERT', 'Khác']}
                colorClass="text-red-400"
                buttonBgClass="bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-red-400/40"
                focusBorderClass="focus:border-red-400"
            />
        </div>
    );
}
