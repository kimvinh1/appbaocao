import { getResourceLinks } from '@/app/actions-resources';
import { getCurrentUser } from '@/lib/auth';
import { ResourceLibrary } from '@/app/components/ui/resource-library';
import { Link2 } from 'lucide-react';

export default async function TaiLieuPage() {
    const [links, currentUser] = await Promise.all([
        getResourceLinks(),
        getCurrentUser(),
    ]);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="page-title flex items-center gap-2">
                    <Link2 size={22} className="text-cyan-500" />
                    Thư Viện Link Tài Liệu
                </h1>
                <p className="page-subtitle mt-1">
                    Link trực tiếp đến IFU, SDS, hướng dẫn máy, kit, phần mềm từ nhà sản xuất. Tìm kiếm nhanh, copy gửi khách hàng.
                </p>
            </div>

            <ResourceLibrary
                links={links}
                currentUserName={currentUser?.fullName ?? ''}
                isAdmin={currentUser?.role === 'admin'}
            />
        </div>
    );
}
