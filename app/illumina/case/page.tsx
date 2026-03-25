import { SharedSupportCasePage } from '@/app/components/kb/support-case-page';

export default function IlluminaCasePage() {
    return (
        <SharedSupportCasePage
            module="illumina"
            title="Nhật Ký Hỗ Trợ – Illumina"
            description="Ghi nhận và theo dõi các case hỗ trợ kỹ thuật về giải trình tự gen."
            instruments={['NextSeq 550', 'NextSeq 1000/2000', 'MiSeq', 'iSeq 100', 'NovaSeq', 'Khác']}
            colorClass="text-orange-300"
            buttonBgClass="bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 ring-orange-400/40"
            focusBorderClass="focus:border-orange-400"
        />
    );
}
