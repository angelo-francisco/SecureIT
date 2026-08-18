import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { type AuthResponse, PasswordlessLogin, useToast } from "@/packages/ui";
import { getWebBaseUrl, openExternally } from "../../api-client";
import { useAuthStore } from "../../hooks";

export default function Login() {
	const navigate = useNavigate();
	const { toast } = useToast();

	const onAuthenticated = (res: AuthResponse) => {
		const store = useAuthStore.getState();
		if (res.access_token) store.setAccessToken(res.access_token);
		store.setUser(res.user ?? null);
		navigate("/profiles");
	};

	const onSetupRequired = (res: AuthResponse) => {
		openExternally(
			`setup?setup_token=${encodeURIComponent(res.setup_token ?? "")}`,
		);
	};

	const onError = (message: string) => {
		toast(message, "error");
	};

	return (
		<div className="min-h-screen">
			<Navbar />
			<section className="select-none bg-bg relative overflow-hidden min-h-screen flex justify-center items-center">
				<div className="p-5 flex flex-col items-center w-full max-w-[480px]">
					<div className="w-full flex flex-col">
						<div className="flex flex-col items-center justify-center gap-1 mb-6">
							<h1 className="text-center text-5xl font-semibold text-text">
								Iniciar Sessão
							</h1>
							<p className="text-text-muted text-xl text-text">
								Escolha como quer entrar para continuar
							</p>
						</div>

						<PasswordlessLogin
							baseUrl={getWebBaseUrl()}
							onAuthenticated={onAuthenticated}
							googleEnabled={false}
							onSetupRequired={onSetupRequired}
							onError={onError}
							footer={
								<div className="text-center pt-1">
									<p className="text-lg text-text-muted">
										Não tem conta?{" "}
										<button
											type="button"
											onClick={async () => await openExternally("signup")}
											className="text-primary font-bold hover:underline cursor-pointer"
										>
											Criar Conta
										</button>
									</p>
								</div>
							}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
