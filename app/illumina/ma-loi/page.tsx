import { SharedErrorCodePage } from '@/app/components/kb/error-code-page';

export default function IlluminaMaLoiPage() {
    return (
        <div className="mx-auto max-w-5xl">
            <SharedErrorCodePage
                module="illumina"
                title="Tra cứu mã lỗi – Illumina"
                description="Cơ sở dữ liệu lỗi, nguyên nhân và hướng xử lý sự cố cho mảng Illumina."
                instruments={['NextSeq 550', 'NextSeq 1000/2000', 'MiSeq', 'NovaSeq 6000', 'iSeq 100', 'MiniSeq']}
                colorClass="text-orange-300"
                buttonBgClass="bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 ring-orange-400/40"
                focusBorderClass="focus:border-orange-400"
            />
        </div>
    );
}
