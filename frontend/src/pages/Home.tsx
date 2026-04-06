import { useSelector } from "react-redux"
import { RootState } from "../redux/store/store"
import Button from "../components/Button"
import { refreshAccessToken } from "../config/api.config"
import { Link } from "react-router-dom"
import { UserPortalView } from "../components/user.portal/SideBar"

function Home() {

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const username = useSelector((state: RootState) => state.auth.username)

  return (
      isAuthenticated ? (
        <>
          <h1>Welcome {username}</h1>
          <Link to={`/user-portal/all/all/${UserPortalView.DASHBOARD}`}><Button text="Go to Dashboard" ></Button></Link>
        </>
      ) : (
        <Button text="Login" onClick={refreshAccessToken}/>
      )
  )
}

export default Home
