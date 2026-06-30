import { useEffect } from "react";
import { useAppAuth } from "../contexts/AppAuthContext";

export const useSyncUserData = (userData: any, setUserData: any) => {
    const { user, isLoading, isAuthenticated } = useAppAuth();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated || !user) {
            return;
        }

        if (userData === undefined) {
            return;
        }

        const nextEmail = user.email ?? "";
        const nextName = user.name ?? "";
        const nextUserId = user.userId ?? "";

        const needsUpdate =
            !userData.email ||
            userData.email !== nextEmail ||
            userData.name !== nextName ||
            userData.userId !== nextUserId;

        if (needsUpdate) {
            setUserData({
                ...userData,
                name: nextName,
                email: nextEmail,
                userId: nextUserId,
            });
        }
    }, [isAuthenticated, isLoading, setUserData, user, userData]);
};
