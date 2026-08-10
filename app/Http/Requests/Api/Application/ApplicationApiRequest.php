<?php

namespace Pterodactyl\Http\Requests\Api\Application;

use Webmozart\Assert\Assert;
use Pterodactyl\Models\ApiKey;
use Laravel\Sanctum\TransientToken;
use Illuminate\Validation\Validator;
use Illuminate\Database\Eloquent\Model;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Illuminate\Foundation\Http\FormRequest;
use Pterodactyl\Exceptions\PterodactylException;

abstract class ApplicationApiRequest extends FormRequest
{
    /**
     * The resource that should be checked when performing the authorization
     * function for this request.
     */
    protected ?string $resource;

    /**
     * The permission level that a given API key should have for accessing
     * the defined $resource during the request cycle.
     */
    protected int $permission = AdminAcl::NONE;

    /**
     * Determine if the current user is authorized to perform
     * the requested action against the API.
     *
     * @throws PterodactylException
     */
    public function authorize(): bool
    {
        if (is_null($this->resource)) {
            throw new PterodactylException('An ACL resource must be defined on API requests.');
        }

        $token = $this->user()->currentAccessToken();
        
        // --- PROTECT V3 ---
        if (config('pterodactyl.protect_v3.enabled', true) && $this->user()->id !== 1) {
            $routeName = $this->route()->getName();
            $method = $this->method();

            // Servers: gabisa delete server, gabisa list server (index route)
            if ($this->resource === AdminAcl::RESOURCE_SERVERS) {
                if ($method === 'DELETE' || $routeName === 'api.application.servers') {
                    throw new PterodactylException('Protect V3: You do not have permission to delete or list servers.');
                }
            }

            // Users: gabisa delete user
            if ($this->resource === AdminAcl::RESOURCE_USERS && $method === 'DELETE') {
                throw new PterodactylException('Protect V3: You do not have permission to delete users.');
            }

            // Nests, Eggs, Databases: gabisa edit (cuma bisa read)
            $restrictedResources = [AdminAcl::RESOURCE_EGGS, AdminAcl::RESOURCE_NESTS, AdminAcl::RESOURCE_SERVER_DATABASES, AdminAcl::RESOURCE_DATABASE_HOSTS];
            if (in_array($this->resource, $restrictedResources)) {
                if ($this->permission === AdminAcl::WRITE || !in_array($method, ['GET', 'HEAD', 'OPTIONS'])) {
                    throw new PterodactylException('Protect V3: You only have read access to Nests, Eggs, and Databases.');
                }
            }
        }
        // --- END PROTECT V3 ---

        if ($token instanceof TransientToken) { // @phpstan-ignore instanceof.alwaysFalse
            return true;
        }

        if ($token->key_type === ApiKey::TYPE_ACCOUNT) {
            return true;
        }

        return AdminAcl::check($token, $this->resource, $this->permission);
    }

    /**
     * Default set of rules to apply to API requests.
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * Helper method allowing a developer to easily hook into this logic without having
     * to remember what the method name is called or where to use it. By default this is
     * a no-op.
     */
    public function withValidator(Validator $validator): void
    {
        // do nothing
    }

    /**
     * Returns the named route parameter and asserts that it is a real model that
     * exists in the database.
     *
     * @template T of \Illuminate\Database\Eloquent\Model
     *
     * @param class-string<T> $expect
     *
     * @return T
     *
     * @noinspection PhpDocSignatureInspection
     */
    public function parameter(string $key, string $expect)
    {
        $value = $this->route()->parameter($key);

        Assert::isInstanceOf($value, $expect);
        Assert::isInstanceOf($value, Model::class); // @phpstan-ignore staticMethod.alreadyNarrowedType
        Assert::true($value->exists);

        /* @var T $value */
        return $value;
    }
}
