import { getErrorCodes, createErrorCode } from '@/app/actions-kb';
import { AlertTriangle, Plus } from 'lucide-react';
import { ErrorCodeList } from './error-code-list';


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
    const fieldClassName = `mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${focusBorderClass}`;
    const fileFieldClassName = `mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none ${focusBorderClass} file:mr-4 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-300 hover:file:bg-slate-700`;

    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                    <AlertTriangle size={22} className={colorClass} /> {title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">{description}</p>
            </div>

            {/* Add Error Code Form */}
            <details className="glass-panel rounded-2xl group">
                <summary className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium transition hover:bg-slate-800/50 list-none ${colorClass}`}>
                    <Plus size={16} className="transition-transform group-open:rotate-45" /> Thêm Mã Lỗi Mới
                </summary>
                <div className="border-t border-slate-300/40 dark:border-slate-700/40 px-5 py-5">
                    <form action={createErrorCode} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="module" value={module} />
                        <label className="text-sm text-slate-700 dark:text-slate-300">
                            Mã Lỗi
                            <input name="code" required placeholder="VD: E204" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-700 dark:text-slate-300">
                            Thiết Bị
                            <select name="instrument" required className={fieldClassName}>
                                {instruments.map((ins) => <option key={ins}>{ins}</option>)}
                            </select>
                        </label>
                        <label className="text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
                            Mô Tả Lỗi
                            <input name="description" required placeholder="Mô tả ngắn gọn" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-700 dark:text-slate-300">
                            Nguyên Nhân
                            <textarea name="cause" required rows={3} placeholder="Mô tả chi tiết nguyên nhân" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-700 dark:text-slate-300">
                            Cách xử lý / quy trình
                            <textarea name="solution" required rows={3} placeholder="Các bước xử lý cụ thể" className={fieldClassName} />
                        </label>
                        <label className="text-sm text-slate-700 dark:text-slate-300 md:col-span-1">
                            Ảnh Minh Họa <span className="text-slate-600 dark:text-slate-600">(upload lên Vercel Blob)</span>
                            <input type="file" accept="image/*" name="imageFile" className={fileFieldClassName} />
                        </label>
                        <label className="text-sm text-slate-700 dark:text-slate-300 md:col-span-1">
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

            {/* Error Code List — client component với filter/search */}
            {errorCodes.length === 0 ? (
                <div className="glass-panel rounded-2xl px-8 py-16 text-center">
                    <p className="text-slate-500 dark:text-slate-600">Chưa có mã lỗi nào. Thêm mã lỗi đầu tiên ở form trên.</p>
                </div>
            ) : (
                <ErrorCodeList errorCodes={errorCodes} instruments={instruments} colorClass={colorClass} />
            )}
        </div>
    );
}
