import { http, type ServerResponse } from "@/util/http";
import storage from "@/util/storage";

export interface Profile
{
    created_at: string
    email: string
    firstname: string
    id: string
    lastname: string
    token: string
    avatar_url: string
    updated_at: string
    username: string
}

class authentication extends(storage)
{
    async login(credential: { username: string; password: string })
    {
        try 
        {
            const response = await http.post('/auth/login', credential, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 200 && response.data.success)
            {
                this.setDuration(new Date());
                this.setRawData('ACCESS_TOKEN', response.data.data.token);

                return true;
            }
        }
        catch (error: any) 
        {
            alert(`Login Error ${error}`);
        }

        return false;
    }

    async logout()
    {
        try 
        {
            const response = await http.get('/auth/logout');

            if (response.status === 200)
            {
                this.clearData();
                location.replace('/login');

                return true;
            }
        } 
        catch (error) 
        {
            this.clearData();
            location.replace('/login');

            return false;
        }
    }

    async userProfile(): Promise<Profile | null>
    {
        const response = await http.get('/user/profile', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.getRawData('ACCESS_TOKEN')}`
            }
        });

        if (response.status == 200)
        {
            const json = response.data as ServerResponse<Profile>;

            if (!this.isAuth)
            {
                this.setUser(json.data);
            }

            return json.data;
        }

        return null;
    }

    async checkAuth(): Promise<boolean>
    {
        const response = await http.get('auth/check', {
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.status == 200)
        {
            const json = response.data as {message: string; success: boolean};

            return json.success;
        }

        this.clearData();

        return false;
    }
    
    data(): Profile | undefined
    {
        const data = this.getData('USER');

        if (!data)
        {
            return undefined;
        }

        return JSON.parse(data as string) as Profile;
    }

    // role(): Role | null
    // {
    //     const user = this.data();

    //     if (user)
    //     {
    //         return user.role;
    //     }

    //     return null;
    // }

    get_expiry_time(): number
    {
        const data = this.getData('EXPIRY_TIME');

        if (!data)
        {
            this.logout();

            return 0;
        }

        return +data;
    }

    is_expired(): boolean
    {
        const data = this.getData('EXPIRY_TIME');
        const now = new Date();
        const threshold = 24 * 60 * 60 * 1000;

        if (data)
        {
            if (Math.abs(now.getTime() - +data) >= threshold)
            {
                return true;
            }
        }

        return false;
    }

    is_auth(): boolean 
    {
        this.isAuth = !!this.getData('USER');
        return this.isAuth as boolean;
    }

    avatar()
    {
        console.log(this.data()?.avatar_url);
        
        return this.data()?.avatar_url || 'https://img.daisyui.com/images/profile/demo/gordon@192.webp';
    }

    // hasPermission(path: string): boolean
    // {
    //     const jsonStr = this.getData('USER');
    //     const user = JSON.parse(jsonStr as string) as Profile;
        
    //     const permissions = user.permission.map((p) => p.name);
        
    //     return permissions.includes(path);
    // }

    // hasRenderPermission(param: Menu | any)
    // {
    //     if (this.is_auth())
    //     {
    //         const jsonStr = this.getData('USER');
    //         const user = JSON.parse(jsonStr as string) as Profile;
    //         const permissions = user.permission.map((p) => p.route);

    //         if (!param.is_header || !param.is_divider)
    //         {
    //             return permissions.includes(param.url);
    //         }

    //         return true;
    //     }

    //     return false;
    // }

    // validate_permission(to: any, next: any)
    // {
    //     if (this.is_auth()) 
    //     {
    //         if (!this.hasPermission(to.name))
    //         {
    //             if (to.path !== '/forbidden') 
    //             {
    //                 next('/forbidden');

    //                 return false;
    //             } 
    //             else 
    //             {
    //                 next();

    //                 return true;
    //             }
    //         }
    //         else
    //         {
    //             next();

    //             return true;
    //         }
    //     }
    //     else
    //     {
    //         if (to.path !== '/login') 
    //         {
    //             next('/login');

    //             return false;
    //         } 
    //         else 
    //         {
    //             // If already on /login, don't redirect again
    //             next();

    //             return true;
    //         }
    //     }
    // }

    updateUser(id: string, user: Profile): Boolean
    {
        const jsonStr = this.getData('USER');
        const auth = JSON.parse(jsonStr as string) as Profile;
        
        if (id === auth.id)
        {
            auth.username = user.username
            auth.email = user.email

            this.setUser(auth);
            
            return true;
        }

        return false;
    }

    // updateRole(id: string, role: Role): Boolean
    // {
    //     const jsonStr = this.getData('USER');
    //     const user = JSON.parse(jsonStr as string) as Profile;
        
    //     if (id === user.role_id)
    //     {
    //         user.role_id = id;
    //         user.role = role;

    //         this.setUser(user);

    //         return true;
    //     }

    //     return false;
    // }

    // insertPermission(roleId: string, permission: Permission)
    // {
    //     const jsonStr = this.getData('USER');
    //     const user = JSON.parse(jsonStr as string) as Profile;
        
    //     if (user.role_id === roleId)
    //     {
    //         user.permission.push(permission);
    //     }

    //     this.setUser(user);
    // }

    // updatePermission(id: string, permission: Permission)
    // {
    //     const jsonStr = this.getData('USER');
    //     const user = JSON.parse(jsonStr as string) as Profile;

    //     if (user.permission.some(p => p._id === id))
    //     {
    //         user.permission.forEach((p) => {
    //             if (p._id === id)
    //             {
    //                 p = permission;
    //             }
    //         });

    //         this.setUser(user);

    //         return true;
    //     }
    // }

    private setUser(user: Profile)
    {
        this.setData('USER', JSON.stringify(user));
        this.isAuth = true;
    }

    private setDuration(date: Date)
    {
        this.setData('EXPIRY_TIME', String(date.getTime()));
    }

    private isAuth: boolean | undefined;
}

export default new authentication();