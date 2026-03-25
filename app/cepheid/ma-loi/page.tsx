import { SharedErrorCodePage } from '@/app/components/kb/error-code-page';

export default function CepheidMaLoiPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <SharedErrorCodePage
        module="cepheid"
        title="Tra cứu mã lỗi – Cepheid"
        description="Cơ sở dữ liệu lỗi, nguyên nhân và hướng xử lý cho nền tảng GeneXpert / Cepheid."
        instruments={['GeneXpert IV', 'GeneXpert XVI', 'GeneXpert Infinity', 'GeneXpert Edge', 'Khác']}
        colorClass="text-cyan-300"
        buttonBgClass="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ring-cyan-400/40"
        focusBorderClass="focus:border-cyan-400"
      />
    </div>
  );
}
