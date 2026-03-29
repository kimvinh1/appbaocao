import { getErrorCodes, createErrorCode } from '@/app/actions-kb';
import { AlertTriangle, Plus, Search, Image as ImageIcon } from 'lucide-react';

const SEVERITY_STYLE: Record<string, string> = {
    low: 'bg-slate-700/60 text-slate-300',
    medium: 'bg-yellow-500/20 text-yellow-300',
    high: 'bg-orange-500/20 text-orange-300',
    critical: 'bg-red-500/20 text-red-300',
};

type ErrorCodePageProps = {
    module: string;
    title: string;
    description: string;
    instruments: string[];
    colorClass: string;
    buttonBgClass: string;
    focusBorderClass: string;
};

export async function SharedErrorCodePage(props: ErrorCodePageProps) {
    const { module, title, description, instruments, colorClass, buttonBgClass, focusBorderClass } = props;
    const errorCodes = await getErrorCodes(module);
    const fieldClassName = `mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${focusBorderClass}`;
    const fileFieldClassName = `mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none ${focusBorderClass} file:mr-4 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-300 hover:file:bg-slate-700`;

    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-2xl font-semibold text-white flex items-center gap-2`}>
                    <AlertTriangle size={22} className={colorClass} /> {title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>

            {/* Add Error Code Form */}
            <details className="glass-panel rounded-2xl group">
                <summary className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium transition hover:bg-slate-800/50 list-none ${colorClass}`}>
                    <Plus size={16} className="transition-transform group-open:rotate-45" /> Thêm Mã Lỗi Mới
                </summary>
                <div className="border-t border-slate-700/40 px-5 py-5">
                    <form action={createErrorCode} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="module" value={module} />
                        <label className="text-sm text-slate-300">
                            Mã Lỗi
                            <input name="code" required placeholder="VD: E204" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300">
                            Thiết Bị
                            <select name="instrument" required className={fieldClassName}>
                                {instruments.map((ins) => <option key={ins}>{ins}</option>)}
                            </select>
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-2">
                            Mô Tả Lỗi
                            <input name="description" required placeholder="Mô tả ngắn gọn" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300">
                            Nguyên Nhân
                            <textarea name="cause" required rows={3} placeholder="Mô tả chi tiết nguyên nhân" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300">
                            Cách xử lý / quy trình
                            <textarea name="solution" required rows={3} placeholder="Các bước xử lý cụ thể" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-1">
                            Ảnh Minh Họa <span className="text-slate-500">(upload lên Vercel Blob)</span>
                            <input type="file" accept="image/*" name="imageFile" className={fileFieldClassName} />
                        </label>
                        <label className="text-sm text-slate-300 md:col-span-1">
                            Mức Độ
                            <select name="severity" required className={fieldClassName}>
                                <option value="low">Thấp</option>
                                <option value="medium">Trung Bình</option>
                                <option value="high">Cao</option>
                                <option value="critical">Nghiêm Trọng</option>
                            </select>
                        </label>
                        <div className="md:col-span-2">
                            <button type="submit" className={`flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium ring-1 transition ${buttonBgClass}`}>
                                <Plus size={16} /> Thêm Mã Lỗi
                            </button>
                        </div>
                    </form>
                </div>
            </details>

            {/* Error Code List */}
            {errorCodes.length === 0 ? (
                <div className="glass-panel rounded-2xl px-8 py-16 text-center">
                    <Search size={40} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Chưa có mã lỗi nào. Thêm mã lỗi đầu tiên ở form trên.</p>
                </div>
            ) : (
                <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
                    {errorCodes.map((ec) => (
                        <details key={ec.id} className="glass-panel rounded-xl group overflow-hidden">
                            <summary className="p-4 flex cursor-pointer items-start justify-between gap-4 outline-none hover:bg-slate-800/40 transition list-none">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono text-lg font-bold ${colorClass}`}>{ec.code}</span>
                                        <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">{ec.instrument}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[ec.severity] ?? 'bg-slate-700 text-slate-300'}`}>
                                            {ec.severity === 'low' ? 'Thấp' : ec.severity === 'medium' ? 'Trung Bình' : ec.severity === 'high' ? 'Cao' : 'Nghiêm Trọng'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-white group-open:text-slate-300 transition-colors">{ec.description}</p>
                                </div>
                                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 group-open:rotate-180 transition-transform">
                                    ▼
                                </div>
                            </summary>
                            <div className="px-4 pb-4 pt-1">
                                <div className="space-y-4 border-t border-slate-700/40 pt-4">
                                    <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 px-4 py-3">
                                        <p className="text-xs font-semibold text-orange-300 mb-1">⚠ Nguyên Nhân</p>
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{ec.cause}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
                                        <p className="text-xs font-semibold text-emerald-300 mb-1">✓ Quy trình xử lý đề xuất</p>
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{ec.solution}</p>
                                    </div>
                                    {ec.imageUrl && (
                                        <div className="rounded-lg border border-slate-700/60 p-2 pl-3 pb-3">
                                            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1"><ImageIcon size={14} /> Hình Ảnh Minh Họa</p>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={ec.imageUrl} alt="Ảnh minh họa" className="max-h-64 rounded bg-slate-900/50 object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </div>
    );
}
