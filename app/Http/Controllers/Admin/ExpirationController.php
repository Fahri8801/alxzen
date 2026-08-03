<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\SuspensionService; // Tambahkan ini

class ExpirationController extends Controller
{
    public function index()
    {
        $servers = Server::query()
            ->select('id', 'name', 'expires_at', 'uuidShort', 'status', 'owner_id', 'node_id', 'allocation_id')
            ->with(['user', 'node', 'allocation'])
            ->orderBy('expires_at', 'asc') // Urutkan dari yang mau expired duluan
            ->paginate(50);

        return view('admin.expiration.index', compact('servers'));
    }

    public function update(Request $request, $id)
    {
        $server = Server::findOrFail($id);

        $request->validate([
            'new_date' => 'nullable|date',
        ]);

        if ($request->filled('new_date')) {
            $newDate = Carbon::parse($request->input('new_date'))->endOfDay();
        } else {
            // Logika tambah 30 hari otomatis
            if ($server->expires_at && $server->expires_at->isFuture()) {
                $newDate = $server->expires_at->addDays(30);
            } else {
                $newDate = Carbon::now()->addDays(30);
            }
        }

        // Simpan tanggal baru
        $server->update([
            'expires_at' => $newDate,
        ]);

        /**
         * OTOMATIS UNSUSPEND
         * Jika admin memperpanjang server yang sedang mati (suspended), 
         * kita panggil service untuk menyalakan aksesnya kembali di Wings.
         */
        if ($server->status === Server::STATUS_SUSPENDED) {
            try {
                // Menggunakan class SuspensionService secara formal agar lebih aman dari error
                app(SuspensionService::class)->toggle($server, SuspensionService::ACTION_UNSUSPEND);
            } catch (\Exception $e) {
                // Jika gagal (node offline), kita tetap beri notifikasi sukses perpanjang tapi warning unsuspend
                return redirect()->back()->with('error', "Tanggal diperbarui, tapi gagal unsuspend otomatis: " . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', "Server {$server->name} diperpanjang sampai {$newDate->format('d-m-Y H:i')}.");
    }

    public function deleteAllExpired()
    {
        $servers = Server::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', Carbon::now())
            ->get();

        if ($servers->isEmpty()) {
            return redirect()->back()->with('success', 'Tidak ada server expired yang perlu dihapus.');
        }

        $count = 0;
        foreach ($servers as $server) {
            try {
                app(\Pterodactyl\Services\Servers\ServerDeletionService::class)->handle($server, false);
                $count++;
            } catch (\Exception $e) {
                \Log::error("Gagal menghapus server expired (ID: {$server->id}): " . $e->getMessage());
            }
        }

        if ($count > 0) {
            return redirect()->back()->with('success', "Berhasil menghapus {$count} server expired. Proses penghapusan berjalan di background.");
        }

        return redirect()->back()->with('error', 'Gagal menghapus server expired. Silakan periksa log sistem.');
    }
}
