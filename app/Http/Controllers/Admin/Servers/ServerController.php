<?php

namespace Pterodactyl\Http\Controllers\Admin\Servers;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Filters\AdminServerFilter;

class ServerController extends Controller
{
    /**
     * Returns all the servers that exist on the system using a paginated result set. If
     * a query is passed along in the request it is also passed to the repository function.
     */
    public function index(Request $request): View
    {
        // 1. Siapkan query dasar
        $query = Server::query()->with('node', 'user', 'allocation');

        // 2. LOGIC TAMBAHAN: 
        // Protect V3: Admin selain ID 1 tidak boleh melihat list server (gabisa list server)
        if ($request->user()->id !== 1) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException('Protect V3: Anda tidak diizinkan untuk melihat daftar server.');
        }

        // 3. Masukkan query yang sudah difilter ke QueryBuilder
        $servers = QueryBuilder::for($query)
            ->allowedFilters([
                AllowedFilter::exact('owner_id'),
                AllowedFilter::custom('*', new AdminServerFilter()),
            ])
            ->paginate(config()->get('pterodactyl.paginate.admin.servers'));

        return view('admin.servers.index', ['servers' => $servers]);
    }
}