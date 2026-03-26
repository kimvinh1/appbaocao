import { getSupportCases, createSupportCase, updateCaseStatus } from '@/app/actions-kb';
import { TicketCheck, Plus } from 'lucide-react';
import { SubmitButton } from '@/app/components/ui/submit-button';
import { CaseImageGallery } from '@/app/components/kb/case-image-gallery';

const STATUS_STYLE: Record<string, string> = {
    open: 'bg-orange-500/20 text-orange-300',
    resolved: 'bg-emerald-500/20 text-emerald-300',
    escalated: 'bg-red-500/20 text-red-300',
};

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
                            Mô Tả Vấn Đề
                            <input name="description" required placeholder="Khách hàng báo lỗi gì, hiện tượng ra sao..." className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-3">
                            Hướng Xử Lý / Kết Quả
                            <input name="resolution" placeholder="Đã làm gì để khắc phục (hoặc để trống nếu đang xử lý)..." className={fieldClassName} />
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
                            Link Ảnh 1 <span className="text-slate-500">(Tuỳ chọn – Google Drive)</span>
                            <input type="url" name="imageUrl1" placeholder="https://drive.google.com/file/d/..." className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-3">
                            Link Ảnh 2 <span className="text-slate-500">(Tuỳ chọn)</span>
                            <input type="url" name="imageUrl2" placeholder="https://drive.google.com/file/d/..." className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-3">
                            Link Tài Liệu Đính Kèm <span className="text-slate-500">(Tuỳ chọn – Google Drive)</span>
                            <input type="url" name="attachmentUrl" placeholder="https://drive.google.com/file/d/..." className={fieldClassName} />
                        </label>

                        <div className="md:col-span-3">
                            <SubmitButton label="Ghi Nhận Case" className={`flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium ring-1 transition ${buttonBgClass}`} icon={<Plus size={16} />} />
                        </div>
                    </form>
                </div>
            </details>

            <div className="glass-panel overflow-x-auto rounded-2xl">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
                        <tr>
                            <th className="px-5 py-4 font-medium">Ngày / Khách</th>
                            <th className="px-5 py-4 font-medium">Vấn Đề / Thiết Bị</th>
                            <th className="px-5 py-4 font-medium">Người Xử Lý</th>
                            <th className="px-5 py-4 font-medium whitespace-nowrap">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                        {cases.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-slate-500 font-medium">
                                    Chưa có case hỗ trợ nào.
                                </td>
                            </tr>
                        ) : (
                            cases.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                                    <td className="px-5 py-4 align-top">
                                        <p className="font-medium text-white">{new Date(c.caseDate).toLocaleDateString('vi-VN')}</p>
                                        <p className="text-xs text-slate-400 mt-1">{c.customer}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-white">{c.description}</p>
                                        <p className="mt-1 text-xs">
                                            <span className="text-slate-400">{c.instrument}</span> • <span className="text-slate-500">{c.issueType}</span>
                                        </p>
                                        {c.resolution && (
                                            <p className="mt-2 text-xs text-emerald-400 bg-emerald-400/10 inline-block px-2 py-1 rounded">
                                                ↳ {c.resolution}
                                            </p>
                                        )}
                                        {c.imageUrls.length > 0 && (
                                            <CaseImageGallery imageUrls={c.imageUrls} title={c.description} />
                                        )}
                                        {c.attachmentUrl && (
                                            <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-cyan-400 bg-cyan-400/10 inline-block px-2 py-1 rounded hover:underline ml-2">
                                                📎 Mở PDF đính kèm
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 align-top font-medium text-slate-300">{c.handler}</td>
                                    <td className="px-5 py-4 align-top">
                                        <form action={updateCaseStatus} className="flex flex-col gap-2">
                                            <input type="hidden" name="id" value={c.id} />
                                            <select
                                                name="status"
                                                defaultValue={c.status}
                                                onChange={(e) => e.target.form?.requestSubmit()}
                                                className={`cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-700 hover:ring-slate-600 focus:ring-slate-500 ${STATUS_STYLE[c.status]}`}
                                            >
                                                <option value="open" className="bg-slate-800 text-orange-300">
                                                    Đang xử lý
                                                </option>
                                                <option value="resolved" className="bg-slate-800 text-emerald-300">
                                                    Đã giải quyết
                                                </option>
                                                <option value="escalated" className="bg-slate-800 text-red-300">
                                                    Leo thang
                                                </option>
                                            </select>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
