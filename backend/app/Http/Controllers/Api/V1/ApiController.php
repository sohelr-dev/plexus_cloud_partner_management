<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;

/**
 * ApiController — base controller for all v1 API endpoints.
 *
 * Response envelope convention (MASTER_PLAN §16):
 *   { data: ..., meta: ..., message: ... }
 */
abstract class ApiController extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Success response.
     */
    protected function success(mixed $data = null, string $message = 'OK', int $status = 200, array $meta = []): JsonResponse
    {
        $body = ['message' => $message];

        if ($data !== null) {
            $body['data'] = $data;
        }

        if ($meta !== []) {
            $body['meta'] = $meta;
        }

        return response()->json($body, $status);
    }

    /**
     * Error response.
     */
    protected function error(string $message, int $status = 400, mixed $errors = null): JsonResponse
    {
        $body = ['message' => $message];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        return response()->json($body, $status);
    }

    /**
     * Created (201) response.
     */
    protected function created(mixed $data = null, string $message = 'Resource created'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /**
     * No content (204) response — used after delete.
     */
    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Paginated collection payload using the resource's collection form.
     */
    protected function paginated($paginator, string $resourceClass, string $message = 'OK'): JsonResponse
    {
        return response()->json([
            'data' => $resourceClass::collection($paginator->items())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
            'message' => $message,
        ]);
    }
}
