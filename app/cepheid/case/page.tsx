import { SharedSupportCasePage } from '@/app/components/kb/support-case-page';

export default function CepheidCasePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <SharedSupportCasePage
        module="cepheid"
        title="Nhật ký hỗ trợ – Cepheid"
        description="Ghi nhận sự cố, ảnh hiện trường và tiến độ xử lý cho các hệ thống GeneXpert."
        instruments={['GeneXpert IV', 'GeneXpert XVI', 'GeneXpert Infinity', 'GeneXpert Edge', 'GeneXpert Omni', 'Khác']}
        colorClass="text-cyan-300"
        buttonBgClass="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ring-cyan-400/40"
        focusBorderClass="focus:border-cyan-400"
      />
    </div>
  );
}
