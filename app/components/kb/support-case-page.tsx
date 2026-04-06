import { getSupportCases, createSupportCase } from '@/app/actions-kb';
import { TicketCheck, Plus } from 'lucide-react';
import { SubmitButton } from '@/app/components/ui/submit-button';
import { RichContentEditor } from '@/app/components/ui/rich-content-editor';
import { CaseTable } from './case-table';

type SupportCasePageProps = {
    module: string;
    title: string;
    description: string;
    instruments: string[];
    colorClass: string;
    buttonBgClass: string;
    focusBorderClass: string;
};

export async function SharedSupportCasePage(props: SupportCasePageProps) {
    const { module, title, description, instruments, colorClass, buttonBgClass, focusBorderClass } = props;
    const cases = await getSupportCases(module);
    const fieldClassName = `mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${focusBorderClass}`;

    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-2xl font-semibold text-white flex items-center gap-2`}>
                    <TicketCheck size={22} className={colorClass} /> {title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>

            <details className="glass-panel rounded-2xl group">
                <summary className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium transition hover:bg-slate-800/50 list-none ${colorClass}`}>
                    <Plus size={16} className="transition-transform group-open:rotate-45" /> Ghi Nhận Case Mới
                </summary>
                <div className="border-t border-slate-700/40 px-5 py-5">
                    <form action={createSupportCase} className="grid gap-4 md:grid-cols-3">
                        <input type="hidden" name="module" value={module} />
                        <label className="text-sm text-slate-300">
                            Ngày Khách Báo
                            <input type="date" name="caseDate" required className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300">
                            Khách Hàng / Đơn Vị
                            <input name="customer" required placeholder="VD: BV Chợ Rẫy" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300">
                            Thiết Bị
                            <select name="instrument" required className={fieldClassName}>
                                {instruments.map((ins) => (
                                    <option key={ins}>{ins}</option>
                                ))}
                            </select>
                        </label>

                        <label className="text-sm text-slate-300 md:col-span-3">
                            Tóm Tắt Case
                            <input name="description" required placeholder="VD: NextSeq báo lỗi fluidics sau khi wash" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-3">
                            Nội Dung Case <span className="text-slate-500">(paste ảnh trực tiếp, ảnh sẽ tự upload lên Vercel Blob)</span>
                            <div className="mt-1">
                                <RichContentEditor name="content" rows={12} />
                            </div>
                        </label>

                        <label className="text-sm text-slate-300">
                            Loại Vấn Đề
                            <select name="issueType" required className={fieldClassName}>
                                <option value="Hardware">Phần cứng</option>
                                <option value="Software">Phần mềm</option>
                                <option value="Reagent">Hóa chất</option>
                                <option value="Application">Ứng dụng</option>
                                <option value="Other">Khác</option>
                            </select>
                        </label>
                        <label className="text-sm text-slate-300">
                            Người Phụ Trách
                            <input name="handler" required placeholder="Tên APP..." className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300">
                            Trạng Thái
                            <select name="status" required className={fieldClassName}>
                                <option value="open">Đang xử lý</option>
                                <option value="resolved">Đã giải quyết</option>
                                <option value="escalated">Leo thang</option>
                            </select>
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-3">
                            Link Tài Liệu Đính Kèm <span className="text-slate-500">(Google Drive hoặc link web hãng)</span>
                            <input type="url" name="attachmentUrl" placeholder="https://drive.google.com/file/d/..." className={fieldClassName} />
                        </label>

                        <div className="md:col-span-3">
                            <SubmitButton label="Ghi Nhận Case" className={`flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium ring-1 transition ${buttonBgClass}`} icon={<Plus size={16} />} />
                        </div>
                    </form>
                </div>
            </details>

            {/* Case table — client component với sort/filter */}
            <CaseTable cases={cases} colorClass={colorClass} focusBorderClass={focusBorderClass} />
        </div>
    );
}
