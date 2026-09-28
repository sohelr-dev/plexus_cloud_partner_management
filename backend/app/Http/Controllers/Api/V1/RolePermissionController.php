<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;


class RolePermissionController extends ApiController
{

    public function index(): JsonResponse
    {
        // super-admin can do everything by Gate bypass, so we exclude it from edit matrix
        $roles = Role::where('name', '!=', 'super-admin')->with('permissions')->get();
        $permissions = Permission::all()->pluck('name');

        $matrix = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ];
        });

        return $this->success([
            'all_permissions' => $permissions,
            'roles' => $matrix,
        ], 'Role permission matrix loaded');
    }

    /**
     * POST /api/v1/roles-permissions/{roleId}
     */
    public function update(Request $request, int $roleId): JsonResponse
    {
        $role = Role::findById($roleId, 'api');
        
        if ($role->name === 'super-admin') {
            return $this->error('Cannot modify super-admin permissions directly.', 403);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $role->syncPermissions($request->input('permissions'));

        return $this->success([
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => $role->permissions()->pluck('name'),
        ], "Permissions updated for role [{$role->name}].");
    }
}
