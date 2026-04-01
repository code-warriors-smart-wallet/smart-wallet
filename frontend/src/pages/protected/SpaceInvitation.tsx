import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/store"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SpaceService } from "../../services/space.service";
import Button from "../../components/Button";
import { UserPortalView } from "../../components/user.portal/SideBar";

export interface InvitationInfo {
   id: string,
   type: string,
   owner: { email: string },
   spaceName: string,
   status: string
}

function SpaceInvitation() {

   const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
   const { getInvitationInfo, acceptInvite, rejectInvite } = SpaceService();
   const navigate = useNavigate();
   const location = useLocation();
   const [searchParams] = useSearchParams();
   const token = searchParams.get("token");

   const [inviteInfo, setInviteInfo] = useState<InvitationInfo | null>(null);
   useEffect(() => {
      if (!token) {
         navigate(`/login`);
         return;
      }

      if (!isAuthenticated) {
         const redirectUrl = encodeURIComponent(location.pathname + location.search);
         console.log("not authenticated: ", redirectUrl);
         navigate(`/login?redirect=${redirectUrl}`);
         return;
      }

      // define async function inside useEffect
      const fetchInviteInfo = async () => {
         console.log("authenticated");
         const inviteInfo = await getInvitationInfo(token || "");
         console.log(inviteInfo)
         setInviteInfo(inviteInfo);
      };

      fetchInviteInfo();
   }, [token, isAuthenticated, navigate, location.pathname, location.search]);


   const onReject = async () => {
      await rejectInvite(token || "")
   }

   const onAccept = async () => {
      await acceptInvite(token || "")
   }

   const onNavigateToSpace = () => {
      navigate(`/user-portal/${inviteInfo?.type.toLowerCase().split("_").join("-")}/${inviteInfo?.id}/${UserPortalView.DASHBOARD}`);
   }

   const onNavigateToDashboard = () => {
      navigate(`/user-portal/all/all/${UserPortalView.DASHBOARD}`);
   }

   return (
      <main className="font-main dark bg-bg-light-primary dark:bg-bg-dark-primary min-h-screen flex flex-col items-center justify-center *:text-text-light-primary *:dark:text-text-dark-primary">
         <div
            className="relative w-full text-center max-w-lg rounded-lg text-2xl font-bold shadow-sm p-3 text-text-light-primary dark:text-text-dark-primary"
         >
            Space Invitation
         </div>
         {
            inviteInfo?.status === "PENDING" ? (
               <>
                  <form className="text-text-light-primary dark:text-text-dark-primary text-center">
                     <span className="font-bold">{inviteInfo?.owner.email}</span> has invited you to collaborate on <span className="font-bold capitalize">{inviteInfo?.spaceName}</span> space.
                     <br />You can accept or reject this invitation.
                     <br />This invitation will expire in 1 day.
                  </form>
                  <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                     <Button
                        text="Reject"
                        className="max-w-fit"
                        priority="secondary"
                        onClick={onReject}
                     />
                     <Button
                        text="Accept"
                        className="max-w-fit ml-3"
                        onClick={onAccept}
                     />
                  </div>
               </>
            ) : inviteInfo?.status === "ACCEPTED" ? (
               <>
                  <p>You are already a member of <span className="font-bold capitalize">{inviteInfo?.spaceName}</span> space.</p>
                  <Button
                     text="Go to space"
                     className="max-w-fit mt-4"
                     priority="secondary"
                     onClick={onNavigateToSpace}
                  />
               </>
            ) : inviteInfo?.status === "REJECTED" ? (
               <>
                  <p>You have already rejected this invitation to space <span className="font-bold capitalize">{inviteInfo?.spaceName}</span>.</p>
                  <p>Ask the space owner a new invitation.</p>
                   <Button
                     text="Go to dashboard"
                     className="max-w-fit mt-4"
                     priority="secondary"
                     onClick={onNavigateToDashboard}
                  />
               </>
            ) : inviteInfo?.status === "LEFT" ? (
               <>
                  <p>You have already left the space <span className="font-bold capitalize">{inviteInfo?.spaceName}</span>.</p>
                  <p>Ask the space owner a new invitation.</p>
                  <Button
                     text="Go to dashboard"
                     className="max-w-fit mt-4"
                     priority="secondary"
                     onClick={onNavigateToDashboard}
                  />
               </>
            ) : inviteInfo?.status === "EXPIRED" ? (
               <>
                  <p>The invitation link to space <span className="font-bold capitalize">{inviteInfo?.spaceName}</span> is expired.</p>
                  <p>Ask the space owner a new invitation.</p>
                  <Button
                     text="Go to dashboard"
                     className="max-w-fit mt-4"
                     priority="secondary"
                     onClick={onNavigateToDashboard}
                  />
               </>
            ) : null
         }
      </main>
   )

}

export default SpaceInvitation;
