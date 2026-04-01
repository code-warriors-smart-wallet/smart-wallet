import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SpaceInfo } from "../interfaces/modals";
import { RootState } from '@/redux/store/store';
import { setSpaces } from '../redux/features/auth';
import { SpaceType } from '@/components/user.portal/views/Spaces';
import { UserPortalView } from '../components/user.portal/SideBar';
import { useState } from 'react';
import { InvitationInfo } from '../pages/protected/SpaceInvitation';

export function SpaceService() {
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.auth.token)
    const navigate = useNavigate();
    const [createSpaceLoading, setCreateSpaceLoading] = useState(false)
    const [inviteLoading, setInviteLoading] = useState(false)
    const [addColLoading, setAddColLoading] = useState(false)

    async function createSpace(body: any): Promise<void> {
        try {
            setCreateSpaceLoading(true);
            const response = await api.post(`user/space/`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data)
            if (response.data.success) {
                const spaces: { id: string, name: string, type: SpaceType }[] = []
                response.data.data.object.forEach((s: any) => {
                    spaces.push({ id: s._id, name: s.name, type: s.type })
                })
                dispatch(setSpaces({ spaces: spaces }))
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        } finally {
            setCreateSpaceLoading(false);
        }
    }

    async function editSpace(id: string, body: SpaceInfo): Promise<void> {
        try {
            setCreateSpaceLoading(true);
            const response = await api.put(`user/space/${id}`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data)
            if (response.data.success) {
                const spaces: { id: string, name: string, type: SpaceType }[] = []
                response.data.data.object.forEach((s: any) => {
                    spaces.push({ id: s._id, name: s.name, type: s.type })
                })
                dispatch(setSpaces({ spaces: spaces }))
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        } finally {
            setCreateSpaceLoading(false);
        }
    }

    async function deleteSpace(id: string): Promise<void> {
        try {
            const response = await api.delete(`user/space/${id}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response)
            if (response.data.success) {
                const spaces: { id: string, name: string, type: SpaceType }[] = []
                response.data?.object?.forEach((s: any) => {
                    spaces.push({ id: s._id, name: s.name, type: s.type })
                })
                dispatch(setSpaces({ spaces: spaces }))
                toast.success(response.data.data.message)
            }

        } catch (error) {
            processError(error)
        }
    }

    async function getSpacesByUser(): Promise<void> {
        try {
            const response = await api.get(`user/space/user`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data)
            if (response.data.success) {
                const spaces = response.data.data.object
            }
        } catch (error) {
            processError(error)
        }
    }

    async function existsUser(email: string): Promise<boolean> {
        try {
            setAddColLoading(true);
            const response = await api.get(`user/space/exists/${email}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                return response.data.data
            }
            return false;
        } catch (error) {
            processError(error)
            return false
        } finally {
            setAddColLoading(false)
        }
    }

    async function addCollaborator(spaceId: string, email: string): Promise<boolean> {
        try {
            setAddColLoading(true);
            const response = await api.post(
                `user/space/col/add`,
                { spaceId, email },
                {
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                }
            );
            setAddColLoading(false);

            if (response.data.success) {
                return true;
            }
            return false;

        } catch (error) {
            processError(error);
            return false;

        } finally {
        }
    }

    async function removeCollaborator(spaceId: string, email: string): Promise<boolean> {
        try {
            setAddColLoading(true);
            const response = await api.delete(
                `user/space/col/remove`,
                {
                    data: { spaceId, email },
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                return true;
            }
            return false;

        } catch (error) {
            processError(error);
            return false;

        } finally {
            setAddColLoading(false);
        }
    }

    async function leftSpace(spaceId: string): Promise<boolean> {
        try {
            setAddColLoading(true);
            const response = await api.delete(
                `user/space/col/left`,
                {
                    data: { spaceId },
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                return true;
            }
            return false;

        } catch (error) {
            processError(error);
            return false;

        } finally {
            setAddColLoading(false);
        }
    }

    async function getInvitationInfo(token2: string): Promise<any> {
        try {
            setInviteLoading(true);
            const response = await api.get(`user/space/invite/info/${token2}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object) // this prints correct answer
            return response.data.data.object;
        } catch (error) {
            processError(error)
            return {}
        } finally {
            setInviteLoading(false)
        }
    }

    async function acceptInvite(token2: string): Promise<void> {
        try {
            setInviteLoading(true);
            const response = await api.put(`user/space/invite/accept/${token2}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data)
            if (response.data.success) {
                const spaceId = response.data.data.object.id;
                const spaceType = response.data.data.object.type;
                navigate(`/user-portal/${spaceType.toLowerCase().split("_").join("-")}/${spaceId}/${UserPortalView.DASHBOARD}`);
            }
        } catch (error) {
            processError(error)
        } finally {
            setInviteLoading(false)
        }
    }

    async function rejectInvite(token2: string): Promise<void> {
        try {
            setInviteLoading(true);
            const response = await api.put(`user/space/invite/reject/${token2}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data)
            if (response.data.success) {
                const spaceId = response.data.data.object.id;
                const spaceType = response.data.data.object.type;
                navigate(`/user-portal/all/all/${UserPortalView.DASHBOARD}`);
            }
        } catch (error) {
            processError(error)
        } finally {
            setInviteLoading(false)
        }
    }

    return { createSpace, getSpacesByUser, editSpace, deleteSpace, existsUser, addCollaborator, removeCollaborator, getInvitationInfo, acceptInvite, rejectInvite, leftSpace, addColLoading, createSpaceLoading, inviteLoading };
}

function processError(error: unknown): void {
    if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.error?.message || "An error occurred while processing your request.";
        toast.error(errorMessage);
    } else {
        toast.error("An unexpected error occurred. Please try again later.");
    }
    console.error("Error details:", error);
}
